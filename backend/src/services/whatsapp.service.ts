import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { OrderService } from './order.service';
import { logger } from '../lib/logger';
import { BUYER_COMMISSION_RATE } from '../lib/constants';

const SESSION_TTL_SECS = 1800; // 30 minutes of inactivity
const LOGISTICS_COST_PER_KG = 4.5;
const BUYER_COMMISSION = BUYER_COMMISSION_RATE;

type ConversationState = 'WELCOME' | 'MENU' | 'BROWSING' | 'QUANTITY' | 'DATE' | 'CONFIRMING' | 'DONE';

interface ListingOption {
  idx: number;
  id: string;
  name: string;
  farmer: string;
  price: number;
  available: number;
  minimumKg: number;
}

interface HistoryEntry {
  from: 'user' | 'bot';
  text: string;
  at: string;
}

interface Session {
  phone: string;
  buyerId: string | null;
  buyerName: string | null;
  state: ConversationState;
  listings: ListingOption[];
  selectedListing: ListingOption | null;
  quantityKg: number | null;
  deliveryDate: string | null;
  lastOrderSummary: string | null;
  history: HistoryEntry[];
}

function sessionKey(phone: string) {
  return `wa:session:${phone}`;
}

async function getSession(phone: string): Promise<Session | null> {
  const raw = await redis.get(sessionKey(phone));
  return raw ? (JSON.parse(raw) as Session) : null;
}

async function saveSession(session: Session): Promise<void> {
  await redis.setex(sessionKey(session.phone), SESSION_TTL_SECS, JSON.stringify(session));
}

function newSession(phone: string): Session {
  return { phone, buyerId: null, buyerName: null, state: 'WELCOME', listings: [], selectedListing: null, quantityKg: null, deliveryDate: null, lastOrderSummary: null, history: [] };
}

function fmt(n: number): string {
  return `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
}

function deliveryOptions(): Array<{ idx: number; label: string; iso: string }> {
  const opts: Array<{ idx: number; label: string; iso: string }> = [];
  let offset = 1;
  while (opts.length < 3 && offset < 14) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    offset++;
    if (d.getDay() !== 0) {
      opts.push({ idx: opts.length + 1, label: fmtDate(d), iso: d.toISOString() });
    }
  }
  return opts;
}

async function fetchListings(): Promise<ListingOption[]> {
  const now = new Date();
  const rows = await prisma.produceListing.findMany({
    where: { status: 'ACTIVE', availableFrom: { lte: now }, availableUntil: { gte: now }, availableKg: { gt: 0 } },
    include: { product: true, grade: true, farmer: { select: { displayName: true } } },
    take: 8,
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((l, i) => ({
    idx: i + 1,
    id: l.id,
    name: l.grade ? `${l.product.name} (Grade ${l.grade.grade})` : l.product.name,
    farmer: l.farmer.displayName,
    price: Number(l.farmGatePrice),
    available: Number(l.availableKg),
    minimumKg: Number(l.minimumOrderKg),
  }));
}

function menuText(name: string): string {
  return `Hi *${name}* 👋 What would you like to do?\n\n1️⃣  Browse today's listings\n2️⃣  Reorder my last order\n\nReply with a number, or *ORDERS* to check your recent orders.`;
}

async function getLastOrderSummary(buyerId: string): Promise<string | null> {
  const order = await prisma.order.findFirst({
    where: { buyerId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { listing: { include: { product: true } } } } },
  });
  if (!order) return null;
  const lines = order.items.map(i => `• ${Number(i.quantityKg)} kg ${i.listing.product.name}`).join('\n');
  return `Last order *${order.orderNumber}*:\n${lines}`;
}

export const WhatsAppService = {
  async handleIncoming(phone: string, text: string): Promise<string> {
    let session = await getSession(phone);
    const cmd = text.trim().toUpperCase();

    // Global commands work from any state
    if (['CANCEL', 'STOP', 'RESET', 'EXIT'].includes(cmd)) {
      await redis.del(sessionKey(phone));
      return "Session cancelled. Text *HI* anytime to start a new order. 🌿";
    }

    if (cmd === 'HELP') {
      return "Available commands:\n• Numbers — navigate menus\n• *ORDERS* — your recent orders\n• *CANCEL* — cancel and start over\n• *HELP* — this message\n\nText *HI* to start ordering.";
    }

    if (['ORDERS', 'STATUS', 'MY ORDERS'].includes(cmd)) {
      return await WhatsAppService.ordersQuery(phone);
    }

    // No session or timed-out — restart
    if (!session) {
      session = newSession(phone);
      const user = await prisma.user.findUnique({ where: { phone }, include: { buyer: true } });
      if (user?.buyer) {
        session.buyerId = user.buyer.id;
        session.buyerName = user.buyer.displayName;
        session.lastOrderSummary = await getLastOrderSummary(user.buyer.id);
        session.state = 'MENU';
        session.history.push({ from: 'bot', text: menuText(session.buyerName), at: new Date().toISOString() });
        await saveSession(session);
        return menuText(session.buyerName);
      } else {
        session.state = 'WELCOME';
        const reply = `Welcome to *FarmConnect SA* 🌿\n\nI'm your fresh produce ordering assistant.\n\nNo account was found for this number. Please contact your FarmConnect sales rep to register, or reply *HI* to try again.`;
        session.history.push({ from: 'bot', text: reply, at: new Date().toISOString() });
        await saveSession(session);
        return reply;
      }
    }

    const userEntry: HistoryEntry = { from: 'user', text: text.trim(), at: new Date().toISOString() };
    session.history.push(userEntry);

    const reply = await processState(session, cmd, text.trim());

    session.history.push({ from: 'bot', text: reply, at: new Date().toISOString() });
    if (session.history.length > 120) session.history = session.history.slice(-120);

    if (session.state === 'DONE') {
      await redis.del(sessionKey(phone));
    } else {
      await saveSession(session);
    }

    return reply;
  },

  async ordersQuery(phone: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { phone }, include: { buyer: true } });
    if (!user?.buyer) return "No account found for this number. Contact your sales rep to get registered.";

    const orders = await prisma.order.findMany({
      where: { buyerId: user.buyer.id, deletedAt: null },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true, status: true, deliveredPrice: true, deliveryDate: true },
    });

    if (!orders.length) return "You have no orders yet. Text *HI* to browse listings and place your first order. 🌿";

    const lines = orders.map(o =>
      `• *${o.orderNumber}* — ${o.status.replace(/_/g, ' ')}\n  ${fmt(Number(o.deliveredPrice))} · ${fmtDate(new Date(o.deliveryDate))}`
    ).join('\n\n');

    return `Your recent orders:\n\n${lines}\n\nText *HI* to place a new order.`;
  },

  async getActiveSessions(): Promise<Array<{ phone: string; buyerName: string | null; state: string; messages: number; lastAt: string }>> {
    const keys = await redis.keys('wa:session:*');
    const results = await Promise.all(
      keys.map(async (k) => {
        const raw = await redis.get(k);
        if (!raw) return null;
        const s = JSON.parse(raw) as Session;
        const last = s.history[s.history.length - 1];
        return { phone: s.phone, buyerName: s.buyerName, state: s.state, messages: s.history.length, lastAt: last?.at ?? '' };
      })
    );
    return results.filter(Boolean) as ReturnType<typeof WhatsAppService.getActiveSessions> extends Promise<infer T> ? T : never;
  },

  async getSessionHistory(phone: string): Promise<{ history: HistoryEntry[]; state: string } | null> {
    const s = await getSession(phone);
    if (!s) return null;
    return { history: s.history, state: s.state };
  },
};

async function processState(session: Session, cmd: string, raw: string): Promise<string> {
  switch (session.state) {
    case 'WELCOME':
    case 'MENU': {
      if (cmd === '2' && session.lastOrderSummary) {
        // Reorder: load listings but highlight last order context
        const listings = await fetchListings();
        session.listings = listings;
        session.state = 'BROWSING';
        if (!listings.length) {
          session.state = 'MENU';
          return "No listings are available right now. Please check back later or contact your sales rep.";
        }
        const hint = `Your last order for reference:\n${session.lastOrderSummary}\n\n`;
        const lines = listings.map(l => `${l.idx}️⃣  *${l.name}* — ${fmt(l.price)}/kg\n   ${l.available.toLocaleString()} kg avail · Min ${l.minimumKg} kg · ${l.farmer}`).join('\n\n');
        return `${hint}Today's available listings:\n\n${lines}\n\nReply with a number to select, or *0* to go back.`;
      }

      if (cmd === '1' || cmd === '2' || cmd === 'HI' || cmd === 'HELLO' || cmd === 'ORDER') {
        const listings = await fetchListings();
        session.listings = listings;
        session.state = 'BROWSING';
        if (!listings.length) {
          session.state = 'MENU';
          return "No listings are available right now. Please check back later or contact your sales rep.";
        }
        const lines = listings.map(l => `${l.idx}️⃣  *${l.name}* — ${fmt(l.price)}/kg\n   ${l.available.toLocaleString()} kg avail · Min ${l.minimumKg} kg · ${l.farmer}`).join('\n\n');
        return `Here's what's available today:\n\n${lines}\n\nReply with a number to select, or *0* to go back.`;
      }

      return menuText(session.buyerName ?? 'there');
    }

    case 'BROWSING': {
      if (cmd === '0') {
        session.state = 'MENU';
        return menuText(session.buyerName ?? 'there');
      }

      const idx = parseInt(cmd, 10);
      const listing = session.listings.find((l) => l.idx === idx);

      if (!listing) {
        return `Please reply with a number between 1 and ${session.listings.length}, or *0* to go back.`;
      }

      session.selectedListing = listing;
      session.state = 'QUANTITY';
      return `You selected:\n*${listing.name}* from ${listing.farmer}\nPrice: ${fmt(listing.price)}/kg\nAvailable: ${listing.available.toLocaleString()} kg · Min ${listing.minimumKg} kg\n\nHow many kg would you like?`;
    }

    case 'QUANTITY': {
      const qty = parseFloat(raw.replace(/[^\d.]/g, ''));
      const listing = session.selectedListing!;

      if (isNaN(qty) || qty <= 0) {
        return `Please reply with a number for the quantity in kg (e.g. *${listing.minimumKg}*).`;
      }
      if (qty < listing.minimumKg) {
        return `The minimum order is *${listing.minimumKg} kg*. Please reply with a quantity of at least ${listing.minimumKg} kg.`;
      }
      if (qty > listing.available) {
        return `Only *${listing.available.toLocaleString()} kg* is currently available. Please reply with a smaller quantity.`;
      }

      session.quantityKg = qty;
      session.state = 'DATE';
      const opts = deliveryOptions();
      const lines = opts.map((o) => `${o.idx}️⃣  ${o.label}`).join('\n');
      return `Got it — *${qty} kg* of ${listing.name}.\n\nWhen should we deliver?\n\n${lines}\n\nReply with a number.`;
    }

    case 'DATE': {
      const opts = deliveryOptions();
      const idx = parseInt(cmd, 10);
      if (isNaN(idx) || idx < 1 || idx > opts.length) {
        return `Please reply with 1, 2, or 3 to select a delivery date.`;
      }

      const chosen = opts[idx - 1];
      session.deliveryDate = chosen.iso;
      session.state = 'CONFIRMING';

      const listing = session.selectedListing!;
      const qty = session.quantityKg!;
      const farmGate = listing.price * qty;
      const logistics = LOGISTICS_COST_PER_KG * qty;
      const commission = farmGate * BUYER_COMMISSION;
      const total = farmGate + logistics + commission;
      const divider = '─'.repeat(28);

      return `Here's your order summary:\n${divider}\n*${qty} kg ${listing.name}*\nFarm gate: ${fmt(listing.price)}/kg = *${fmt(farmGate)}*\nLogistics: ${fmt(LOGISTICS_COST_PER_KG)}/kg = ${fmt(logistics)}\nCommission (8%): ${fmt(commission)}\n${divider}\n*TOTAL: ${fmt(total)}*\nDelivery: *${chosen.label}*\nPayment: 7-day terms\n${divider}\n\nReply *YES* to confirm or *NO* to cancel.`;
    }

    case 'CONFIRMING': {
      if (['YES', 'Y', 'CONFIRM', 'OK', 'YEP', 'YA'].includes(cmd)) {
        if (!session.buyerId) {
          return "Unable to place order — buyer account not found. Please contact your sales rep.";
        }
        const listing = session.selectedListing!;
        const qty = session.quantityKg!;
        const delivDate = new Date(session.deliveryDate!);

        try {
          const order = await OrderService.createOrder(session.buyerId, {
            items: [{ listingId: listing.id, quantityKg: qty }],
            deliveryDate: delivDate.toISOString(),
            source: 'WHATSAPP',
          });

          session.state = 'DONE';
          const farmGate = listing.price * qty;
          const total = farmGate + LOGISTICS_COST_PER_KG * qty + farmGate * BUYER_COMMISSION;
          return `✅ *Order confirmed!*\nReference: *${order.orderNumber}*\n${qty} kg ${listing.name}\nDelivery: ${fmtDate(delivDate)}\nTotal: ${fmt(total)} (7-day terms)\n\nYou'll receive updates as your order progresses. Reply *ORDERS* to check your orders anytime. 🌿`;
        } catch (e) {
          logger.error({ err: e }, 'WhatsApp order placement failed');
          session.state = 'MENU';
          return "Sorry, we couldn't place your order right now. Please try again or contact your sales rep.";
        }
      }

      if (['NO', 'N', 'NOPE'].includes(cmd)) {
        session.state = 'MENU';
        session.selectedListing = null;
        session.quantityKg = null;
        session.deliveryDate = null;
        return `Order cancelled. ${menuText(session.buyerName ?? 'there')}`;
      }

      return "Please reply *YES* to confirm your order or *NO* to cancel.";
    }

    default: {
      session.state = 'MENU';
      return menuText(session.buyerName ?? 'there');
    }
  }
}
