/**
 * Demo seed — populates realistic corridor data for UI development.
 * Run: npx tsx prisma/demo-seed.ts
 */
import { PrismaClient, Province, OrgType, BuyerType, ProductCategory, UnitType, QualityGrade, OrderStatus, PaymentStatus, PayoutStatus, DeliveryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash('demo1234', 10);

  // ── Products ────────────────────────────────────────────────────────────────
  const tomato = await prisma.product.upsert({ where: { id: 'prod-tomato-round' }, update: {}, create: { id: 'prod-tomato-round', name: 'Tomatoes (Round)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } });
  const avocado = await prisma.product.upsert({ where: { id: 'prod-avocado-hass' }, update: {}, create: { id: 'prod-avocado-hass', name: 'Avocados (Hass)', category: ProductCategory.FRUIT, unitType: UnitType.KG } });
  const pepper = await prisma.product.upsert({ where: { id: 'prod-pepper-green' }, update: {}, create: { id: 'prod-pepper-green', name: 'Peppers (Green)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } });
  const spinach = await prisma.product.upsert({ where: { id: 'prod-spinach' }, update: {}, create: { id: 'prod-spinach', name: 'Spinach', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } });

  // ── Grade standards ──────────────────────────────────────────────────────────
  const gradeB = await prisma.produceGrade.upsert({ where: { id: 'grade-tomato-b' }, update: {}, create: { id: 'grade-tomato-b', productId: tomato.id, grade: QualityGrade.B, description: 'Restaurant quality — minor surface marks (<5% skin)', maxBlemishPct: 5 } });
  const gradeA = await prisma.produceGrade.upsert({ where: { id: 'grade-tomato-a' }, update: {}, create: { id: 'grade-tomato-a', productId: tomato.id, grade: QualityGrade.A, description: 'Export quality — uniform, no blemishes', maxBlemishPct: 0 } });

  // ── Cooperative org ──────────────────────────────────────────────────────────
  const mahelaOrg = await prisma.organization.upsert({ where: { id: 'org-mahela' }, update: {}, create: { id: 'org-mahela', name: 'Mahela Fresh Produce Cooperative', type: OrgType.COOPERATIVE } });
  const zz2Org = await prisma.organization.upsert({ where: { id: 'org-zz2' }, update: {}, create: { id: 'org-zz2', name: 'ZZ2 Farms', type: OrgType.COOPERATIVE } });
  const mogOrg = await prisma.organization.upsert({ where: { id: 'org-mog' }, update: {}, create: { id: 'org-mog', name: 'Mogalakwena Smallholder Cooperative', type: OrgType.COOPERATIVE } });

  // ── Farmer users ─────────────────────────────────────────────────────────────
  const f1User = await prisma.user.upsert({ where: { email: 'mahela@demo.farmconnect.co.za' }, update: {}, create: { email: 'mahela@demo.farmconnect.co.za', passwordHash: pw, role: 'FARMER' } });
  const f2User = await prisma.user.upsert({ where: { email: 'zz2@demo.farmconnect.co.za' }, update: {}, create: { email: 'zz2@demo.farmconnect.co.za', passwordHash: pw, role: 'FARMER' } });
  const f3User = await prisma.user.upsert({ where: { email: 'mog@demo.farmconnect.co.za' }, update: {}, create: { email: 'mog@demo.farmconnect.co.za', passwordHash: pw, role: 'FARMER' } });

  const farmer1 = await prisma.farmer.upsert({ where: { userId: f1User.id }, update: {}, create: { userId: f1User.id, organizationId: mahelaOrg.id, displayName: 'Mahela Cooperative', province: Province.LIMPOPO, district: 'Tzaneen', gpsLat: -23.833, gpsLng: 30.175, isSmallholder: false, ficaVerified: true } });
  const farmer2 = await prisma.farmer.upsert({ where: { userId: f2User.id }, update: {}, create: { userId: f2User.id, organizationId: zz2Org.id, displayName: 'ZZ2 Farms — Unit 4', province: Province.LIMPOPO, district: 'Mooketsi', gpsLat: -23.717, gpsLng: 30.032, isSmallholder: false, ficaVerified: true } });
  const farmer3 = await prisma.farmer.upsert({ where: { userId: f3User.id }, update: {}, create: { userId: f3User.id, organizationId: mogOrg.id, displayName: 'Mogalakwena Cooperative', province: Province.LIMPOPO, district: 'Mokopane', gpsLat: -24.199, gpsLng: 28.920, isSmallholder: true, ficaVerified: true } });

  // ── Listings ─────────────────────────────────────────────────────────────────
  const from = new Date(); from.setDate(from.getDate() - 1);
  const until = new Date(); until.setDate(until.getDate() + 7);

  await prisma.produceListing.upsert({ where: { id: 'lst-tomato-mahela' }, update: {}, create: { id: 'lst-tomato-mahela', farmerId: farmer1.id, productId: tomato.id, gradeId: gradeB.id, farmGatePrice: 5.50, availableKg: 2000, minimumOrderKg: 100, availableFrom: from, availableUntil: until, status: 'ACTIVE', photos: { create: [{ r2Key: 'demo/tomatoes-1.jpg', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80', sortOrder: 0 }] } } });
  await prisma.produceListing.upsert({ where: { id: 'lst-tomato-zz2' }, update: {}, create: { id: 'lst-tomato-zz2', farmerId: farmer2.id, productId: tomato.id, gradeId: gradeA.id, farmGatePrice: 6.20, availableKg: 3500, minimumOrderKg: 200, availableFrom: from, availableUntil: until, status: 'ACTIVE', photos: { create: [{ r2Key: 'demo/tomatoes-2.jpg', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80', sortOrder: 0 }] } } });
  await prisma.produceListing.upsert({ where: { id: 'lst-avocado-mahela' }, update: {}, create: { id: 'lst-avocado-mahela', farmerId: farmer1.id, productId: avocado.id, farmGatePrice: 18.00, availableKg: 800, minimumOrderKg: 50, availableFrom: from, availableUntil: until, status: 'ACTIVE', photos: { create: [{ r2Key: 'demo/avocado.jpg', url: 'https://images.unsplash.com/photo-1623227866882-c005c26dfe41?w=600&q=80', sortOrder: 0 }] } } });
  await prisma.produceListing.upsert({ where: { id: 'lst-pepper-mog' }, update: {}, create: { id: 'lst-pepper-mog', farmerId: farmer3.id, productId: pepper.id, farmGatePrice: 12.50, availableKg: 400, minimumOrderKg: 50, availableFrom: from, availableUntil: until, status: 'ACTIVE', photos: { create: [{ r2Key: 'demo/peppers.jpg', url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80', sortOrder: 0 }] } } });
  await prisma.produceListing.upsert({ where: { id: 'lst-spinach-mog' }, update: {}, create: { id: 'lst-spinach-mog', farmerId: farmer3.id, productId: spinach.id, farmGatePrice: 8.00, availableKg: 300, minimumOrderKg: 25, availableFrom: from, availableUntil: until, status: 'ACTIVE', photos: { create: [{ r2Key: 'demo/spinach.jpg', url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80', sortOrder: 0 }] } } });

  // ── Buyer org + address ──────────────────────────────────────────────────────
  const sandtonOrg = await prisma.organization.upsert({ where: { id: 'org-forti' }, update: {}, create: { id: 'org-forti', name: 'Forti Restaurant Group', type: OrgType.RESTAURANT_GROUP } });
  const addr = await prisma.address.upsert({ where: { id: 'addr-sandton' }, update: {}, create: { id: 'addr-sandton', organizationId: sandtonOrg.id, line1: '12 Maude St', suburb: 'Sandton', city: 'Johannesburg', province: Province.GAUTENG, postalCode: '2196', gpsLat: -26.107, gpsLng: 28.056 } });

  const bUser = await prisma.user.upsert({ where: { email: 'buyer@demo.farmconnect.co.za' }, update: {}, create: { email: 'buyer@demo.farmconnect.co.za', passwordHash: pw, role: 'BUYER', phone: '+27721234567' } });
  const buyer = await prisma.buyer.upsert({ where: { userId: bUser.id }, update: {}, create: { userId: bUser.id, organizationId: sandtonOrg.id, displayName: 'Forti Sandton', buyerType: BuyerType.RESTAURANT, deliveryAddressId: addr.id, whatsappNumber: '+27721234567', ficaVerified: true, creditLimit: 50000, preferredPaymentTerms: 7 } });

  // ── Demo orders ──────────────────────────────────────────────────────────────
  const delivDate = new Date(); delivDate.setDate(delivDate.getDate() + 2);
  const dueDate = new Date(delivDate); dueDate.setDate(dueDate.getDate() + 7);

  const order1 = await prisma.order.upsert({ where: { id: 'ord-demo-001' }, update: {}, create: {
    id: 'ord-demo-001', orderNumber: 'FC-2026-000001', buyerId: buyer.id,
    status: OrderStatus.DELIVERED, deliveryDate: delivDate,
    totalFarmGateValue: 1100, logisticsCharge: 900, deliveredPrice: 3200,
    paymentTermDays: 7, paymentDueDate: dueDate, source: 'WEB',
    items: { create: [{ listingId: 'lst-tomato-mahela', quantityKg: 200, farmGatePrice: 5.50, deliveredPrice: 16.00 }] },
  }});

  const order2 = await prisma.order.upsert({ where: { id: 'ord-demo-002' }, update: {}, create: {
    id: 'ord-demo-002', orderNumber: 'FC-2026-000002', buyerId: buyer.id,
    status: OrderStatus.IN_TRANSIT, deliveryDate: new Date(Date.now() + 86400000),
    totalFarmGateValue: 930, logisticsCharge: 765, deliveredPrice: 2720,
    paymentTermDays: 7, paymentDueDate: dueDate, source: 'WHATSAPP',
    items: { create: [{ listingId: 'lst-tomato-zz2', quantityKg: 150, farmGatePrice: 6.20, deliveredPrice: 17.20 }] },
  }});

  const order3 = await prisma.order.upsert({ where: { id: 'ord-demo-003' }, update: {}, create: {
    id: 'ord-demo-003', orderNumber: 'FC-2026-000003', buyerId: buyer.id,
    status: OrderStatus.CONFIRMED, deliveryDate: new Date(Date.now() + 2 * 86400000),
    totalFarmGateValue: 900, logisticsCharge: 225, deliveredPrice: 1620,
    paymentTermDays: 7, paymentDueDate: dueDate, source: 'WEB',
    items: { create: [{ listingId: 'lst-avocado-mahela', quantityKg: 50, farmGatePrice: 18.00, deliveredPrice: 32.40 }] },
  }});

  // Payments
  await prisma.payment.upsert({ where: { orderId: 'ord-demo-001' }, update: {}, create: { orderId: 'ord-demo-001', amount: 3200, method: 'INSTANT_EFT', status: PaymentStatus.PAID, paidAt: new Date(), dueDate } });
  await prisma.payment.upsert({ where: { orderId: 'ord-demo-002' }, update: {}, create: { orderId: 'ord-demo-002', amount: 2720, method: 'ACCOUNT_TO_ACCOUNT', status: PaymentStatus.PENDING, dueDate } });
  await prisma.payment.upsert({ where: { orderId: 'ord-demo-003' }, update: {}, create: { orderId: 'ord-demo-003', amount: 1620, method: 'INSTANT_EFT', status: PaymentStatus.PAID, paidAt: new Date(), dueDate } });

  // Payouts for delivered order
  await prisma.payout.upsert({ where: { id: 'pay-demo-001' }, update: {}, create: { id: 'pay-demo-001', orderId: 'ord-demo-001', farmerId: farmer1.id, grossAmount: 1100, commission: 55, netAmount: 1045, status: PayoutStatus.PAID, scheduledFor: new Date(Date.now() - 86400000), paidAt: new Date(Date.now() - 43200000) } });
  await prisma.payout.upsert({ where: { id: 'pay-demo-002' }, update: {}, create: { id: 'pay-demo-002', orderId: 'ord-demo-002', farmerId: farmer2.id, grossAmount: 930, commission: 46.50, netAmount: 883.50, status: PayoutStatus.PENDING, scheduledFor: new Date(Date.now() + 86400000) } });

  // ── Sales rep user ────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'sales@demo.farmconnect.co.za' },
    update: {},
    create: { email: 'sales@demo.farmconnect.co.za', passwordHash: pw, role: 'SALES_REP' },
  });

  // ── Field agent user ──────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'agent@demo.farmconnect.co.za' },
    update: {},
    create: { email: 'agent@demo.farmconnect.co.za', passwordHash: pw, role: 'FIELD_AGENT' },
  });

  // ── Logistics coordinator user ─────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'logistics@demo.farmconnect.co.za' },
    update: {},
    create: { email: 'logistics@demo.farmconnect.co.za', passwordHash: pw, role: 'LOGISTICS_COORDINATOR' },
  });

  // ── Logistics route ───────────────────────────────────────────────────────
  const n1Route = await prisma.logisticsRoute.upsert({
    where: { id: 'route-n1-lgc' },
    update: {},
    create: { id: 'route-n1-lgc', name: 'N1 Limpopo–Gauteng Corridor', corridor: 'LIMPOPO_GAUTENG', departureTime: '04:00', estimatedHours: 7, isActive: true },
  });

  // ── Delivery records ───────────────────────────────────────────────────────
  await prisma.delivery.upsert({
    where: { orderId: 'ord-demo-001' },
    update: { routeId: n1Route.id },
    create: {
      orderId: 'ord-demo-001', routeId: n1Route.id,
      status: DeliveryStatus.DELIVERED,
      vehicleRef: 'FC-TRK-001', driverName: 'Sipho Dlamini', driverPhone: '+27721110001',
      collectionAt: new Date(Date.now() - 8 * 3600000),
      hubArrivalAt: new Date(Date.now() - 4 * 3600000),
      deliveredAt: new Date(Date.now() - 1 * 3600000),
    },
  });
  await prisma.delivery.upsert({
    where: { orderId: 'ord-demo-002' },
    update: { routeId: n1Route.id },
    create: {
      orderId: 'ord-demo-002', routeId: n1Route.id,
      status: DeliveryStatus.AT_HUB,
      vehicleRef: 'FC-TRK-002', driverName: 'Themba Ndlovu', driverPhone: '+27721110002',
      collectionAt: new Date(Date.now() - 6 * 3600000),
      hubArrivalAt: new Date(Date.now() - 2 * 3600000),
    },
  });
  await prisma.delivery.upsert({
    where: { orderId: 'ord-demo-003' },
    update: { routeId: n1Route.id },
    create: {
      orderId: 'ord-demo-003', routeId: n1Route.id,
      status: DeliveryStatus.SCHEDULED,
      vehicleRef: 'FC-TRK-001', driverName: 'Sipho Dlamini', driverPhone: '+27721110001',
    },
  });

  console.log('Demo seed complete ✓');
  console.log('  Farmers:   mahela@demo, zz2@demo, mog@demo (pw: demo1234)');
  console.log('  Buyer:     buyer@demo.farmconnect.co.za  (pw: demo1234)');
  console.log('  Sales rep:   sales@demo.farmconnect.co.za (pw: demo1234)');
  console.log('  Field agent: agent@demo.farmconnect.co.za (pw: demo1234)');
  console.log('  Logistics: logistics@demo.farmconnect.co.za (pw: demo1234)');
  console.log('  Listings: 5 active across Limpopo');
  console.log('  Orders: 3 (1 delivered, 1 at hub, 1 scheduled)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
