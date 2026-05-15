import { Worker, Job } from 'bullmq';
import PDFDocument from 'pdfkit';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import type { InvoiceJobData } from './queues';
import { BUYER_COMMISSION_RATE } from '../lib/constants';

const BRAND = '#1a6b45';
const GRAY = '#6b7280';
const DARK = '#111827';

function fmt(n: number): string {
  return `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function generatePdf(invoiceId: string): Promise<Buffer> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      order: {
        include: {
          buyer: { include: { deliveryAddress: true } },
          items: { include: { listing: { include: { product: true, grade: true } } } },
        },
      },
    },
  });

  const { order } = invoice;
  const { buyer } = order;
  const addr = buyer.deliveryAddress;
  const lineItems = invoice.lineItems as Array<{ name: string; quantityKg: number; farmGatePrice: number; amount: number }>;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 55, info: { Title: invoice.invoiceNumber } });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 110; // usable width
    const L = 55; // left margin
    const R = doc.page.width - 55; // right edge

    // ── Header ───────────────────────────────────────────────────────────────
    doc.fontSize(22).fillColor(BRAND).font('Helvetica-Bold').text('FarmConnect SA', L, 55);
    doc.fontSize(9).fillColor(GRAY).font('Helvetica').text('Direct from Limpopo farms  ·  farmconnect.co.za  ·  VAT No: 4450267891*', L, 80);

    doc.fontSize(28).fillColor(DARK).font('Helvetica-Bold').text('TAX INVOICE', L, 55, { align: 'right' });

    const metaY = 88;
    doc.fontSize(9).fillColor(GRAY).font('Helvetica');
    [
      ['Invoice:', invoice.invoiceNumber],
      ['Order:', order.orderNumber],
      ['Date:', fmtDate(invoice.issuedAt ?? invoice.createdAt)],
      ['Due:', invoice.dueDate ? fmtDate(invoice.dueDate) : '—'],
    ].forEach(([label, value], i) => {
      doc.font('Helvetica').fillColor(GRAY).text(label, L, metaY + i * 13, { continued: false, align: 'right', width: W });
      doc.font('Helvetica-Bold').fillColor(DARK).text(` ${value}`, L, metaY + i * 13 - 1, { align: 'right', width: W });
    });

    // ── Divider ───────────────────────────────────────────────────────────────
    const divY = 148;
    doc.moveTo(L, divY).lineTo(R, divY).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // ── Addresses ────────────────────────────────────────────────────────────
    const addrY = divY + 14;
    doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('FROM', L, addrY);
    doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text('FarmConnect SA (Pty) Ltd', L, addrY + 13);
    doc.fontSize(9).font('Helvetica').fillColor(GRAY)
      .text('support@farmconnect.co.za', L, addrY + 27)
      .text('*VAT No shown for demonstration purposes only', L, addrY + 40);

    const billX = L + W / 2 + 10;
    doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('BILL TO', billX, addrY);
    doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(buyer.displayName, billX, addrY + 13);
    doc.fontSize(9).font('Helvetica').fillColor(GRAY);
    if (addr) {
      doc.text(addr.line1, billX, addrY + 27)
        .text(`${addr.suburb}, ${addr.city} ${addr.postalCode}`, billX, addrY + 40);
    }

    // ── Delivery date ─────────────────────────────────────────────────────────
    const delY = addrY + 60;
    doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(`Delivery Date:  `, L, delY, { continued: true });
    doc.font('Helvetica-Bold').fillColor(DARK).text(fmtDate(order.deliveryDate));

    // ── Items table ───────────────────────────────────────────────────────────
    const tableY = delY + 22;
    doc.moveTo(L, tableY).lineTo(R, tableY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    const col = { desc: L, qty: L + W * 0.55, up: L + W * 0.70, amt: L + W * 0.83 };
    const thY = tableY + 8;
    doc.fontSize(8).font('Helvetica').fillColor(GRAY);
    doc.text('DESCRIPTION', col.desc, thY);
    doc.text('QTY', col.qty, thY);
    doc.text('UNIT PRICE', col.up, thY);
    doc.text('AMOUNT', col.amt, thY, { width: R - col.amt, align: 'right' });

    doc.moveTo(L, thY + 14).lineTo(R, thY + 14).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    let rowY = thY + 22;
    doc.font('Helvetica').fontSize(9).fillColor(DARK);

    for (const item of lineItems) {
      doc.text(item.name, col.desc, rowY, { width: col.qty - col.desc - 8 });
      doc.text(`${Number(item.quantityKg).toLocaleString()} kg`, col.qty, rowY);
      doc.text(`R${Number(item.farmGatePrice).toFixed(2)}/kg`, col.up, rowY);
      doc.text(fmt(Number(item.amount)), col.amt, rowY, { width: R - col.amt, align: 'right' });
      rowY += 18;
    }

    // Logistics row
    const totalKg = order.items.reduce((s, i) => s + Number(i.quantityKg), 0);
    doc.fillColor(GRAY).fontSize(9);
    doc.text('Logistics & cold chain (N1 corridor)', col.desc, rowY, { width: col.qty - col.desc - 8 });
    doc.text(`${totalKg.toLocaleString()} kg × R4.50`, col.qty, rowY);
    doc.text('', col.up, rowY);
    doc.text(fmt(Number(order.logisticsCharge)), col.amt, rowY, { width: R - col.amt, align: 'right' });
    rowY += 18;

    // Platform fee
    const farmGateTotal = order.items.reduce((s, i) => s + Number(i.farmGatePrice) * Number(i.quantityKg), 0);
    const commissionAmt = farmGateTotal * BUYER_COMMISSION_RATE;
    doc.text('Platform commission (8%)', col.desc, rowY, { width: col.qty - col.desc - 8 });
    doc.text('', col.qty, rowY);
    doc.text('', col.up, rowY);
    doc.text(fmt(commissionAmt), col.amt, rowY, { width: R - col.amt, align: 'right' });
    rowY += 10;

    // ── Totals ────────────────────────────────────────────────────────────────
    doc.moveTo(L, rowY).lineTo(R, rowY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    rowY += 10;

    const subtotal = Number(invoice.subtotal);
    const vat = Number(invoice.vatAmount);
    const total = Number(invoice.total);

    const totColLabel = col.up - 10;
    const totColVal = col.amt;

    doc.fontSize(9).font('Helvetica').fillColor(GRAY);
    doc.text('Subtotal (excl. VAT)', totColLabel, rowY, { width: col.amt - totColLabel - 4, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(DARK).text(fmt(subtotal), totColVal, rowY, { width: R - totColVal, align: 'right' });
    rowY += 16;

    doc.font('Helvetica').fillColor(GRAY);
    doc.text('VAT (0% — zero-rated fresh produce)', totColLabel, rowY, { width: col.amt - totColLabel - 4, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(DARK).text(fmt(vat), totColVal, rowY, { width: R - totColVal, align: 'right' });
    rowY += 6;

    doc.moveTo(totColLabel, rowY).lineTo(R, rowY).strokeColor(BRAND).lineWidth(1).stroke();
    rowY += 8;

    doc.fontSize(11).font('Helvetica-Bold').fillColor(BRAND);
    doc.text('TOTAL DUE', totColLabel, rowY, { width: col.amt - totColLabel - 4, align: 'right' });
    doc.fillColor(DARK).text(fmt(total), totColVal, rowY, { width: R - totColVal, align: 'right' });

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.fontSize(8).font('Helvetica').fillColor(GRAY)
      .text(`Payment terms: ${order.paymentTermDays ?? 7} days from delivery date  ·  This is a VAT tax invoice issued by FarmConnect SA (Pty) Ltd`, L, doc.page.height - 70, { align: 'center', width: W });

    doc.end();
  });
}

export async function processInvoiceJob(data: InvoiceJobData): Promise<void> {
  const { invoiceId } = data;

  const existing = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { status: true } });
  if (!existing || existing.status !== 'DRAFT') {
    logger.info({ invoiceId }, 'Invoice already generated — skipping');
    return;
  }

  const pdfBuffer = await generatePdf(invoiceId);

  let pdfUrl: string;
  if (process.env.R2_ACCOUNT_ID) {
    const { buildKey, getUploadUrl, publicUrl } = await import('../lib/r2');
    const key = buildKey(`invoices/${invoiceId}`, 'pdf');
    const uploadUrl = await getUploadUrl(key, 'application/pdf');
    await fetch(uploadUrl, { method: 'PUT', body: pdfBuffer, headers: { 'Content-Type': 'application/pdf' } });
    pdfUrl = publicUrl(key);
  } else {
    pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'ISSUED', issuedAt: new Date(), pdfUrl },
  });

  logger.info({ invoiceId }, 'Invoice PDF generated');
}

export function startInvoiceWorker() {
  const worker = new Worker<InvoiceJobData>(
    'invoices',
    (job: Job<InvoiceJobData>) => processInvoiceJob(job.data),
    { connection: redis, concurrency: 3 }
  );

  worker.on('failed', (job, err) => {
    logger.error({ invoiceId: job?.data.invoiceId, err }, 'Invoice job failed');
  });

  return worker;
}
