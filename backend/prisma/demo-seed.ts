/**
 * Demo seed — comprehensive SA produce catalogue, farmers across all 9 provinces.
 * Run: npx tsx prisma/demo-seed.ts
 */
import {
  PrismaClient, Province, OrgType, BuyerType, ProductCategory,
  UnitType, QualityGrade, OrderStatus, PaymentStatus, PayoutStatus, DeliveryStatus,
  ComplianceDocType, ComplianceDocStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Unsplash photo helpers ────────────────────────────────────────────────────
function img(id: string) { return `https://images.unsplash.com/photo-${id}?w=600&q=80&fit=crop`; }

const PHOTOS: Record<string, string> = {
  // ── Vegetables ──
  'tomato':       img('1592924357228-91a4daadcfea'),
  'tomato-2':     img('1518977676601-b53f82aba655'),
  'pepper-green': img('1563565375-f3fdfdbefa83'),
  'pepper-red':   img('1583119022894-919a68a3d0e3'),
  'spinach':      img('1576045057995-568f588f82fb'),
  'onion':        img('1508747703725-719777637510'),
  'carrot':       img('1447175008436-054170c2e979'),
  'potato':       img('1518977822534-7049a61ee0c2'),
  'sweet-potato': img('1596097635121-14b38b5e8080'),
  'butternut':    img('1601649342507-f08cc1d14f5b'),
  'cabbage':      img('1551754655-cd27e38d2076'),
  'broccoli':     img('1459411621453-7b03977f4bfc'),
  'cauliflower':  img('1613743983303-b3e89f8a2b80'),
  'green-beans':  img('1471943038054-fd4a9965e0e8'),
  'baby-marrow':  img('1566842600175-97dca3c5ad8e'),
  'beetroot':     img('1598887941560-61f7c56b0b6e'),
  'pumpkin':      img('1508193638397-1cc4ff75af33'),
  'garlic':       img('1540148426945-6cf22a6b2383'),
  'ginger':       img('1571680322205-5c7b49b92ede'),
  'mushroom':     img('1504545102780-26774c1bb073'),
  'leek':         img('1566458634453-e2f1e4a3e1df'),
  // ── Fruits ──
  'avocado':      img('1623227866882-c005c26dfe41'),
  'mango':        img('1553279768-865429fa0078'),
  'orange':       img('1547514701-42782101795e'),
  'lemon':        img('1571771894821-ce9b6c11b08e'),
  'banana':       img('1528825871115-3581a5387919'),
  'apple-green':  img('1567306226416-28f0efdc88ce'),
  'apple-red':    img('1570913149827-d2ac84ab3f9a'),
  'pear':         img('1568702846914-96b305d2aaeb'),
  'grape-red':    img('1537640538966-79f369143f8f'),
  'grape-white':  img('1615484477778-ca3b77940c25'),
  'strawberry':   img('1464965911861-746a04b4bca6'),
  'blueberry':    img('1498557850523-fd3d118b962e'),
  'peach':        img('1563114773-84221bd62daa'),
  'plum':         img('1606914469633-bd45058e8f4f'),
  'pineapple':    img('1550258987-190a2d41a8ba'),
  'watermelon':   img('1587049352851-8d4e89133924'),
  'guava':        img('1580910051074-3eb694886505'),
  'litchi':       img('1597362925123-77861d3fbac7'),
  'fig':          img('1601004890684-d8cbf643f5f2'),
  'grapefruit':   img('1587396539073-4a7f79a5e7b3'),
};

// ─── Upsert helper for listing + photo ────────────────────────────────────────
async function upsertListing(id: string, data: {
  farmerId: string; productId: string; gradeId?: string;
  price: number; kg: number; minKg: number; photoKey: string;
  from: Date; until: Date;
}) {
  const photoUrl = PHOTOS[data.photoKey] ?? PHOTOS['tomato'];
  return prisma.produceListing.upsert({
    where: { id },
    update: {},
    create: {
      id,
      farmerId: data.farmerId,
      productId: data.productId,
      gradeId: data.gradeId,
      farmGatePrice: data.price,
      availableKg: data.kg,
      minimumOrderKg: data.minKg,
      availableFrom: data.from,
      availableUntil: data.until,
      status: 'ACTIVE',
      photos: { create: [{ r2Key: `demo/${id}.jpg`, url: photoUrl, sortOrder: 0 }] },
    },
  });
}

async function main() {
  const pw = await bcrypt.hash('demo1234', 10);
  const from = new Date(); from.setDate(from.getDate() - 2);
  const until = new Date(); until.setDate(until.getDate() + 30);

  // ════════════════════════════════════════════════════════════════════════════
  // PRODUCTS — vegetables
  // ════════════════════════════════════════════════════════════════════════════
  const [
    tomato, pepper_green, spinach,
    onion, carrot, potato, sweet_potato, butternut, cabbage,
    broccoli, cauliflower, green_beans, baby_marrow, beetroot,
    pumpkin, garlic, ginger, mushroom, leek, pepper_red,
  ] = await Promise.all([
    prisma.product.upsert({ where: { id: 'prod-tomato-round' }, update: {}, create: { id: 'prod-tomato-round', name: 'Tomatoes (Round)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-pepper-green' }, update: {}, create: { id: 'prod-pepper-green', name: 'Peppers (Green)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-spinach' }, update: {}, create: { id: 'prod-spinach', name: 'Spinach', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-onion-brown' }, update: {}, create: { id: 'prod-onion-brown', name: 'Onions (Brown)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-carrot' }, update: {}, create: { id: 'prod-carrot', name: 'Carrots', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-potato' }, update: {}, create: { id: 'prod-potato', name: 'Potatoes (Table)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-sweet-potato' }, update: {}, create: { id: 'prod-sweet-potato', name: 'Sweet Potatoes', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-butternut' }, update: {}, create: { id: 'prod-butternut', name: 'Butternut Squash', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-cabbage' }, update: {}, create: { id: 'prod-cabbage', name: 'Cabbage (Green)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-broccoli' }, update: {}, create: { id: 'prod-broccoli', name: 'Broccoli', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-cauliflower' }, update: {}, create: { id: 'prod-cauliflower', name: 'Cauliflower', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-green-beans' }, update: {}, create: { id: 'prod-green-beans', name: 'Green Beans (Snap)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-baby-marrow' }, update: {}, create: { id: 'prod-baby-marrow', name: 'Baby Marrow', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-beetroot' }, update: {}, create: { id: 'prod-beetroot', name: 'Beetroot', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-pumpkin' }, update: {}, create: { id: 'prod-pumpkin', name: 'Pumpkin (Flat White)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-garlic' }, update: {}, create: { id: 'prod-garlic', name: 'Garlic', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-ginger' }, update: {}, create: { id: 'prod-ginger', name: 'Ginger (Fresh Root)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-mushroom' }, update: {}, create: { id: 'prod-mushroom', name: 'Mushrooms (Button)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-leek' }, update: {}, create: { id: 'prod-leek', name: 'Leeks', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-pepper-red' }, update: {}, create: { id: 'prod-pepper-red', name: 'Peppers (Red)', category: ProductCategory.VEGETABLES, unitType: UnitType.KG } }),
  ]);

  // ── Fruits ──
  const [
    avocado, mango, orange, lemon, banana,
    apple_granny, apple_pinkladу, pear, grape_red, grape_white,
    strawberry, blueberry, peach, plum, pineapple,
    watermelon, guava, litchi, fig, grapefruit,
  ] = await Promise.all([
    prisma.product.upsert({ where: { id: 'prod-avocado-hass' }, update: {}, create: { id: 'prod-avocado-hass', name: 'Avocados (Hass)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-mango-kent' }, update: {}, create: { id: 'prod-mango-kent', name: 'Mangoes (Kent)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-orange-valencia' }, update: {}, create: { id: 'prod-orange-valencia', name: 'Oranges (Valencia)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-lemon' }, update: {}, create: { id: 'prod-lemon', name: 'Lemons', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-banana-cavendish' }, update: {}, create: { id: 'prod-banana-cavendish', name: 'Bananas (Cavendish)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-apple-granny' }, update: {}, create: { id: 'prod-apple-granny', name: 'Apples (Granny Smith)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-apple-pinklady' }, update: {}, create: { id: 'prod-apple-pinklady', name: 'Apples (Pink Lady)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-pear-packham' }, update: {}, create: { id: 'prod-pear-packham', name: 'Pears (Packham)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-grape-red' }, update: {}, create: { id: 'prod-grape-red', name: 'Table Grapes (Red Globe)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-grape-white' }, update: {}, create: { id: 'prod-grape-white', name: 'Table Grapes (Autumn Crisp)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-strawberry' }, update: {}, create: { id: 'prod-strawberry', name: 'Strawberries', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-blueberry' }, update: {}, create: { id: 'prod-blueberry', name: 'Blueberries', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-peach' }, update: {}, create: { id: 'prod-peach', name: 'Peaches', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-plum' }, update: {}, create: { id: 'prod-plum', name: 'Plums', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-pineapple' }, update: {}, create: { id: 'prod-pineapple', name: 'Pineapple', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-watermelon' }, update: {}, create: { id: 'prod-watermelon', name: 'Watermelon', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-guava' }, update: {}, create: { id: 'prod-guava', name: 'Guavas', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-litchi' }, update: {}, create: { id: 'prod-litchi', name: 'Litchis', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-fig' }, update: {}, create: { id: 'prod-fig', name: 'Figs (Fresh)', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
    prisma.product.upsert({ where: { id: 'prod-grapefruit' }, update: {}, create: { id: 'prod-grapefruit', name: 'Grapefruit', category: ProductCategory.FRUIT, unitType: UnitType.KG } }),
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // GRADE STANDARDS (for key products)
  // ════════════════════════════════════════════════════════════════════════════
  const gradeToB = await prisma.produceGrade.upsert({ where: { id: 'grade-tomato-b' }, update: {}, create: { id: 'grade-tomato-b', productId: tomato.id, grade: QualityGrade.B, description: 'Restaurant quality — minor surface marks (<5% skin)', maxBlemishPct: 5 } });
  const gradeToA = await prisma.produceGrade.upsert({ where: { id: 'grade-tomato-a' }, update: {}, create: { id: 'grade-tomato-a', productId: tomato.id, grade: QualityGrade.A, description: 'Export quality — uniform, no blemishes', maxBlemishPct: 0 } });
  const gradeAvA = await prisma.produceGrade.upsert({ where: { id: 'grade-avo-a' }, update: {}, create: { id: 'grade-avo-a', productId: avocado.id, grade: QualityGrade.A, description: 'Export class — no surface blemishes, consistent sizing 200–280 g', minSizeG: 200, maxBlemishPct: 0 } });
  const gradeAvB = await prisma.produceGrade.upsert({ where: { id: 'grade-avo-b' }, update: {}, create: { id: 'grade-avo-b', productId: avocado.id, grade: QualityGrade.B, description: 'Local market — minor skin marks, 150 g+', minSizeG: 150, maxBlemishPct: 8 } });
  const gradeGrA = await prisma.produceGrade.upsert({ where: { id: 'grade-grape-a' }, update: {}, create: { id: 'grade-grape-a', productId: grape_red.id, grade: QualityGrade.A, description: 'Export punnet — tight bunch, bloom intact, uniform colour', maxBlemishPct: 0 } });
  const gradeApA = await prisma.produceGrade.upsert({ where: { id: 'grade-apple-a' }, update: {}, create: { id: 'grade-apple-a', productId: apple_granny.id, grade: QualityGrade.A, description: 'Export class 1 — 65 mm+ diameter, no russeting, consistent colour', minSizeG: 130, maxBlemishPct: 0 } });
  const gradeApB = await prisma.produceGrade.upsert({ where: { id: 'grade-apple-b' }, update: {}, create: { id: 'grade-apple-b', productId: apple_granny.id, grade: QualityGrade.B, description: 'Local market — 60 mm+ diameter, minor blemishes', minSizeG: 110, maxBlemishPct: 10 } });

  // ════════════════════════════════════════════════════════════════════════════
  // ORGANISATIONS
  // ════════════════════════════════════════════════════════════════════════════
  const [
    mahelaOrg, zz2Org, mogOrg,
    bergOrg, stellenOrg,
    natalOrg, midlandsOrg,
    hazyviewOrg, lowveldOrg,
    sundaysOrg, kalahariOrg,
    freestateOrg, cullinanOrg, britsOrg,
  ] = await Promise.all([
    prisma.organization.upsert({ where: { id: 'org-mahela' }, update: {}, create: { id: 'org-mahela', name: 'Mahela Fresh Produce Cooperative', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-zz2' }, update: {}, create: { id: 'org-zz2', name: 'ZZ2 Farms', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-mog' }, update: {}, create: { id: 'org-mog', name: 'Mogalakwena Smallholder Cooperative', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-bergriver' }, update: {}, create: { id: 'org-bergriver', name: 'Berg River Fresh Farms', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-stellenbosch' }, update: {}, create: { id: 'org-stellenbosch', name: 'Stellenbosch Fruit Exchange', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-natal' }, update: {}, create: { id: 'org-natal', name: 'uMngeni Valley Growers', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-midlands' }, update: {}, create: { id: 'org-midlands', name: 'KZN Midlands Berry Growers', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-hazyview' }, update: {}, create: { id: 'org-hazyview', name: 'Hazyview Tropical Fruit Growers', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-lowveld' }, update: {}, create: { id: 'org-lowveld', name: 'Lowveld Citrus Producers', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-sundays' }, update: {}, create: { id: 'org-sundays', name: 'Sundays River Citrus Company', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-kalahari' }, update: {}, create: { id: 'org-kalahari', name: 'Kalahari Desert Growers', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-freestate' }, update: {}, create: { id: 'org-freestate', name: 'Free State Vegetable Producers Association', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-cullinan' }, update: {}, create: { id: 'org-cullinan', name: 'Cullinan Urban Agri', type: OrgType.COOPERATIVE } }),
    prisma.organization.upsert({ where: { id: 'org-brits' }, update: {}, create: { id: 'org-brits', name: 'Brits Vegetable Growers Cooperative', type: OrgType.COOPERATIVE } }),
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // FARMERS — users + profiles (all 9 provinces)
  // ════════════════════════════════════════════════════════════════════════════
  const farmerDefs = [
    // ── Limpopo (3 existing) ──────────────────────────────────────────────────
    { email: 'mahela@demo.farmconnect.co.za',  name: 'Mahela Cooperative',         org: mahelaOrg.id,    province: Province.LIMPOPO,       district: 'Tzaneen',        lat: -23.833, lng: 30.175, small: false },
    { email: 'zz2@demo.farmconnect.co.za',     name: 'ZZ2 Farms — Unit 4',         org: zz2Org.id,       province: Province.LIMPOPO,       district: 'Mooketsi',       lat: -23.717, lng: 30.032, small: false },
    { email: 'mog@demo.farmconnect.co.za',     name: 'Mogalakwena Cooperative',    org: mogOrg.id,       province: Province.LIMPOPO,       district: 'Mokopane',       lat: -24.199, lng: 28.920, small: true  },
    // ── Western Cape ─────────────────────────────────────────────────────────
    { email: 'bergriver@demo.farmconnect.co.za', name: 'Berg River Fresh Farms',   org: bergOrg.id,      province: Province.WESTERN_CAPE,  district: 'Villiersdorp',   lat: -33.987, lng: 19.285, small: false },
    { email: 'stellenbosch@demo.farmconnect.co.za', name: 'Stellenbosch Fruit Exchange', org: stellenOrg.id, province: Province.WESTERN_CAPE, district: 'Stellenbosch', lat: -33.932, lng: 18.860, small: false },
    // ── KwaZulu-Natal ─────────────────────────────────────────────────────────
    { email: 'natal@demo.farmconnect.co.za',   name: 'uMngeni Valley Growers',     org: natalOrg.id,     province: Province.KWAZULU_NATAL, district: 'Richmond',       lat: -29.869, lng: 30.258, small: false },
    { email: 'midlands@demo.farmconnect.co.za',name: 'KZN Midlands Berry Growers', org: midlandsOrg.id,  province: Province.KWAZULU_NATAL, district: 'Howick',         lat: -29.476, lng: 30.238, small: true  },
    // ── Mpumalanga ───────────────────────────────────────────────────────────
    { email: 'hazyview@demo.farmconnect.co.za',name: 'Hazyview Tropical Fruits',   org: hazyviewOrg.id,  province: Province.MPUMALANGA,    district: 'Hazyview',       lat: -25.050, lng: 31.131, small: false },
    { email: 'lowveld@demo.farmconnect.co.za', name: 'Lowveld Citrus Producers',   org: lowveldOrg.id,   province: Province.MPUMALANGA,    district: 'Nelspruit',      lat: -25.475, lng: 30.970, small: false },
    // ── Eastern Cape ─────────────────────────────────────────────────────────
    { email: 'sundays@demo.farmconnect.co.za', name: 'Sundays River Citrus Co.',   org: sundaysOrg.id,   province: Province.EASTERN_CAPE,  district: 'Kirkwood',       lat: -33.390, lng: 25.445, small: false },
    // ── Northern Cape ─────────────────────────────────────────────────────────
    { email: 'kalahari@demo.farmconnect.co.za',name: 'Kalahari Desert Growers',    org: kalahariOrg.id,  province: Province.NORTHERN_CAPE, district: 'Upington',       lat: -28.461, lng: 21.256, small: false },
    // ── Free State ───────────────────────────────────────────────────────────
    { email: 'freestate@demo.farmconnect.co.za',name:'Parys Valley Vegetables',    org: freestateOrg.id, province: Province.FREE_STATE,    district: 'Parys',          lat: -26.895, lng: 27.454, small: true  },
    // ── Gauteng ──────────────────────────────────────────────────────────────
    { email: 'cullinan@demo.farmconnect.co.za',name: 'Cullinan Urban Agri',        org: cullinanOrg.id,  province: Province.GAUTENG,       district: 'Cullinan',       lat: -25.673, lng: 28.519, small: true  },
    // ── North West ───────────────────────────────────────────────────────────
    { email: 'brits@demo.farmconnect.co.za',   name: 'Brits Valley Growers',       org: britsOrg.id,     province: Province.NORTH_WEST,    district: 'Brits',          lat: -25.637, lng: 27.779, small: false },
  ];

  const farmers: Record<string, { id: string }> = {};
  for (const def of farmerDefs) {
    const u = await prisma.user.upsert({ where: { email: def.email }, update: {}, create: { email: def.email, passwordHash: pw, role: 'FARMER' } });
    const f = await prisma.farmer.upsert({
      where: { userId: u.id }, update: {},
      create: {
        userId: u.id, organizationId: def.org, displayName: def.name,
        province: def.province, district: def.district,
        gpsLat: def.lat, gpsLng: def.lng,
        isSmallholder: def.small, ficaVerified: true,
      },
    });
    const key = def.email.split('@')[0];
    farmers[key] = f;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LISTINGS — province-appropriate produce with photos
  // ════════════════════════════════════════════════════════════════════════════

  // ── Limpopo: Mahela (tomatoes, avocados, mangoes, lemons) ──────────────────
  await upsertListing('lst-tomato-mahela',   { farmerId: farmers['mahela'].id, productId: tomato.id,   gradeId: gradeToB.id, price: 5.50,  kg: 2000, minKg: 100, photoKey: 'tomato',   from, until });
  await upsertListing('lst-avocado-mahela',  { farmerId: farmers['mahela'].id, productId: avocado.id,  gradeId: gradeAvA.id, price: 18.00, kg: 800,  minKg: 50,  photoKey: 'avocado',  from, until });
  await upsertListing('lst-mango-mahela',    { farmerId: farmers['mahela'].id, productId: mango.id,    price: 14.00, kg: 1200, minKg: 50,  photoKey: 'mango',    from, until });
  await upsertListing('lst-lemon-mahela',    { farmerId: farmers['mahela'].id, productId: lemon.id,    price: 6.00,  kg: 600,  minKg: 25,  photoKey: 'lemon',    from, until });

  // ── Limpopo: ZZ2 (tomatoes A-grade, peppers, spinach) ────────────────────
  await upsertListing('lst-tomato-zz2',      { farmerId: farmers['zz2'].id,    productId: tomato.id,   gradeId: gradeToA.id, price: 6.20,  kg: 3500, minKg: 200, photoKey: 'tomato-2', from, until });
  await upsertListing('lst-pepper-red-zz2',  { farmerId: farmers['zz2'].id,    productId: pepper_red.id, price: 16.00, kg: 500, minKg: 50,  photoKey: 'pepper-red',  from, until });
  await upsertListing('lst-guava-zz2',       { farmerId: farmers['zz2'].id,    productId: guava.id,    price: 9.00,  kg: 400,  minKg: 25,  photoKey: 'guava',    from, until });

  // ── Limpopo: Mogalakwena (peppers, spinach, sweet potato, garlic) ──────────
  await upsertListing('lst-pepper-mog',      { farmerId: farmers['mog'].id,    productId: pepper_green.id, price: 12.50, kg: 400, minKg: 50, photoKey: 'pepper-green', from, until });
  await upsertListing('lst-spinach-mog',     { farmerId: farmers['mog'].id,    productId: spinach.id,  price: 8.00,  kg: 300,  minKg: 25,  photoKey: 'spinach',  from, until });
  await upsertListing('lst-sweetpotato-mog', { farmerId: farmers['mog'].id,    productId: sweet_potato.id, price: 7.50, kg: 600, minKg: 50, photoKey: 'sweet-potato', from, until });
  await upsertListing('lst-garlic-mog',      { farmerId: farmers['mog'].id,    productId: garlic.id,   price: 28.00, kg: 200,  minKg: 20,  photoKey: 'garlic',   from, until });

  // ── Western Cape: Berg River (apples, pears, blueberries, peaches) ────────
  await upsertListing('lst-apple-granny-berg', { farmerId: farmers['bergriver'].id, productId: apple_granny.id, gradeId: gradeApA.id, price: 8.50, kg: 3000, minKg: 100, photoKey: 'apple-green', from, until });
  await upsertListing('lst-apple-pinkladу-berg', { farmerId: farmers['bergriver'].id, productId: apple_pinkladу.id, gradeId: gradeApB.id, price: 9.00, kg: 2500, minKg: 100, photoKey: 'apple-red', from, until });
  await upsertListing('lst-pear-berg',         { farmerId: farmers['bergriver'].id, productId: pear.id,    price: 7.50,  kg: 1800, minKg: 100, photoKey: 'pear',     from, until });
  await upsertListing('lst-peach-berg',        { farmerId: farmers['bergriver'].id, productId: peach.id,   price: 10.00, kg: 900,  minKg: 50,  photoKey: 'peach',    from, until });
  await upsertListing('lst-plum-berg',         { farmerId: farmers['bergriver'].id, productId: plum.id,    price: 11.00, kg: 600,  minKg: 50,  photoKey: 'plum',     from, until });

  // ── Western Cape: Stellenbosch (grapes, strawberries, blueberries) ────────
  await upsertListing('lst-grape-red-stellen',   { farmerId: farmers['stellenbosch'].id, productId: grape_red.id,   gradeId: gradeGrA.id, price: 22.00, kg: 1500, minKg: 50, photoKey: 'grape-red',   from, until });
  await upsertListing('lst-grape-white-stellen', { farmerId: farmers['stellenbosch'].id, productId: grape_white.id, price: 20.00, kg: 1200, minKg: 50,  photoKey: 'grape-white', from, until });
  await upsertListing('lst-strawberry-stellen',  { farmerId: farmers['stellenbosch'].id, productId: strawberry.id,  price: 35.00, kg: 400,  minKg: 20,  photoKey: 'strawberry',  from, until });
  await upsertListing('lst-blueberry-stellen',   { farmerId: farmers['stellenbosch'].id, productId: blueberry.id,   price: 55.00, kg: 200,  minKg: 10,  photoKey: 'blueberry',   from, until });
  await upsertListing('lst-fig-stellen',         { farmerId: farmers['stellenbosch'].id, productId: fig.id,         price: 30.00, kg: 250,  minKg: 10,  photoKey: 'fig',         from, until });

  // ── KwaZulu-Natal: uMngeni (bananas, avocados, pineapple, ginger) ─────────
  await upsertListing('lst-banana-natal',        { farmerId: farmers['natal'].id, productId: banana.id,   price: 5.50,  kg: 2000, minKg: 100, photoKey: 'banana',   from, until });
  await upsertListing('lst-avocado-natal',       { farmerId: farmers['natal'].id, productId: avocado.id,  gradeId: gradeAvB.id, price: 15.50, kg: 1000, minKg: 50, photoKey: 'avocado', from, until });
  await upsertListing('lst-pineapple-natal',     { farmerId: farmers['natal'].id, productId: pineapple.id, price: 8.00, kg: 600,  minKg: 50,  photoKey: 'pineapple', from, until });
  await upsertListing('lst-ginger-natal',        { farmerId: farmers['natal'].id, productId: ginger.id,   price: 25.00, kg: 300,  minKg: 20,  photoKey: 'ginger',   from, until });

  // ── KwaZulu-Natal: Midlands (strawberries, blueberries, broccoli, cauliflower) ──
  await upsertListing('lst-blueberry-midlands',  { farmerId: farmers['midlands'].id, productId: blueberry.id,  price: 50.00, kg: 150,  minKg: 10,  photoKey: 'blueberry',  from, until });
  await upsertListing('lst-strawberry-midlands', { farmerId: farmers['midlands'].id, productId: strawberry.id, price: 32.00, kg: 300,  minKg: 20,  photoKey: 'strawberry', from, until });
  await upsertListing('lst-broccoli-midlands',   { farmerId: farmers['midlands'].id, productId: broccoli.id,   price: 14.00, kg: 500,  minKg: 50,  photoKey: 'broccoli',   from, until });
  await upsertListing('lst-cauliflower-midlands',{ farmerId: farmers['midlands'].id, productId: cauliflower.id,price: 12.00, kg: 400,  minKg: 50,  photoKey: 'cauliflower',from, until });

  // ── Mpumalanga: Hazyview (mangoes, litchis, avocados, banana) ─────────────
  await upsertListing('lst-mango-hazyview',      { farmerId: farmers['hazyview'].id, productId: mango.id,    price: 12.50, kg: 2000, minKg: 100, photoKey: 'mango',    from, until });
  await upsertListing('lst-litchi-hazyview',     { farmerId: farmers['hazyview'].id, productId: litchi.id,   price: 28.00, kg: 500,  minKg: 20,  photoKey: 'litchi',   from, until });
  await upsertListing('lst-avocado-hazyview',    { farmerId: farmers['hazyview'].id, productId: avocado.id,  gradeId: gradeAvA.id, price: 17.00, kg: 1200, minKg: 50, photoKey: 'avocado', from, until });
  await upsertListing('lst-banana-hazyview',     { farmerId: farmers['hazyview'].id, productId: banana.id,   price: 5.00,  kg: 1500, minKg: 100, photoKey: 'banana',   from, until });

  // ── Mpumalanga: Lowveld (oranges, grapefruit, lemons, pumpkin) ────────────
  await upsertListing('lst-orange-lowveld',      { farmerId: farmers['lowveld'].id, productId: orange.id,    price: 4.50,  kg: 5000, minKg: 200, photoKey: 'orange',   from, until });
  await upsertListing('lst-grapefruit-lowveld',  { farmerId: farmers['lowveld'].id, productId: grapefruit.id,price: 4.00,  kg: 2000, minKg: 100, photoKey: 'grapefruit',from, until });
  await upsertListing('lst-lemon-lowveld',       { farmerId: farmers['lowveld'].id, productId: lemon.id,     price: 5.00,  kg: 1500, minKg: 100, photoKey: 'lemon',    from, until });
  await upsertListing('lst-pumpkin-lowveld',     { farmerId: farmers['lowveld'].id, productId: pumpkin.id,   price: 4.50,  kg: 1000, minKg: 50,  photoKey: 'pumpkin',  from, until });

  // ── Eastern Cape: Sundays River (oranges, grapefruit, sweet potato, lemons) ──
  await upsertListing('lst-orange-sundays',      { farmerId: farmers['sundays'].id, productId: orange.id,    price: 3.80,  kg: 8000, minKg: 300, photoKey: 'orange',   from, until });
  await upsertListing('lst-grapefruit-sundays',  { farmerId: farmers['sundays'].id, productId: grapefruit.id,price: 3.50,  kg: 3000, minKg: 150, photoKey: 'grapefruit',from, until });
  await upsertListing('lst-sweetpotato-sundays', { farmerId: farmers['sundays'].id, productId: sweet_potato.id, price: 6.50, kg: 1200, minKg: 50, photoKey: 'sweet-potato', from, until });
  await upsertListing('lst-lemon-sundays',       { farmerId: farmers['sundays'].id, productId: lemon.id,     price: 4.20,  kg: 2000, minKg: 100, photoKey: 'lemon',    from, until });

  // ── Northern Cape: Kalahari (grapes, watermelon, onions, carrots) ─────────
  await upsertListing('lst-grape-red-kalahari',  { farmerId: farmers['kalahari'].id, productId: grape_red.id,  gradeId: gradeGrA.id, price: 19.00, kg: 2000, minKg: 50, photoKey: 'grape-red', from, until });
  await upsertListing('lst-grape-white-kalahari',{ farmerId: farmers['kalahari'].id, productId: grape_white.id, price: 18.00, kg: 1500, minKg: 50, photoKey: 'grape-white', from, until });
  await upsertListing('lst-watermelon-kalahari', { farmerId: farmers['kalahari'].id, productId: watermelon.id, price: 2.80,  kg: 5000, minKg: 200, photoKey: 'watermelon', from, until });
  await upsertListing('lst-onion-kalahari',      { farmerId: farmers['kalahari'].id, productId: onion.id,      price: 3.50,  kg: 4000, minKg: 200, photoKey: 'onion',    from, until });

  // ── Free State: Parys Valley (potatoes, carrots, onions, cabbage, cauliflower) ─
  await upsertListing('lst-potato-freestate',    { farmerId: farmers['freestate'].id, productId: potato.id,     price: 4.00,  kg: 6000, minKg: 250, photoKey: 'potato',   from, until });
  await upsertListing('lst-carrot-freestate',    { farmerId: farmers['freestate'].id, productId: carrot.id,     price: 5.50,  kg: 3000, minKg: 100, photoKey: 'carrot',   from, until });
  await upsertListing('lst-onion-freestate',     { farmerId: farmers['freestate'].id, productId: onion.id,      price: 3.80,  kg: 4000, minKg: 200, photoKey: 'onion',    from, until });
  await upsertListing('lst-cabbage-freestate',   { farmerId: farmers['freestate'].id, productId: cabbage.id,    price: 3.50,  kg: 2000, minKg: 100, photoKey: 'cabbage',  from, until });
  await upsertListing('lst-cauliflower-freestate',{ farmerId: farmers['freestate'].id, productId: cauliflower.id, price: 11.00, kg: 600, minKg: 50, photoKey: 'cauliflower', from, until });

  // ── Gauteng: Cullinan Urban Agri (mushrooms, baby marrow, beetroot, leeks, spinach) ─
  await upsertListing('lst-mushroom-cullinan',   { farmerId: farmers['cullinan'].id, productId: mushroom.id,    price: 40.00, kg: 300,  minKg: 10,  photoKey: 'mushroom', from, until });
  await upsertListing('lst-babymarrow-cullinan', { farmerId: farmers['cullinan'].id, productId: baby_marrow.id, price: 12.00, kg: 400,  minKg: 20,  photoKey: 'baby-marrow', from, until });
  await upsertListing('lst-beetroot-cullinan',   { farmerId: farmers['cullinan'].id, productId: beetroot.id,    price: 7.00,  kg: 500,  minKg: 25,  photoKey: 'beetroot', from, until });
  await upsertListing('lst-leek-cullinan',       { farmerId: farmers['cullinan'].id, productId: leek.id,        price: 15.00, kg: 300,  minKg: 20,  photoKey: 'leek',     from, until });
  await upsertListing('lst-spinach-cullinan',    { farmerId: farmers['cullinan'].id, productId: spinach.id,     price: 9.00,  kg: 400,  minKg: 25,  photoKey: 'spinach',  from, until });

  // ── North West: Brits Valley (butternut, pumpkin, cabbage, green beans, tomatoes) ──
  await upsertListing('lst-butternut-brits',     { farmerId: farmers['brits'].id, productId: butternut.id,     price: 6.00,  kg: 3000, minKg: 100, photoKey: 'butternut',   from, until });
  await upsertListing('lst-pumpkin-brits',       { farmerId: farmers['brits'].id, productId: pumpkin.id,       price: 4.50,  kg: 2500, minKg: 100, photoKey: 'pumpkin',     from, until });
  await upsertListing('lst-cabbage-brits',       { farmerId: farmers['brits'].id, productId: cabbage.id,       price: 3.20,  kg: 2000, minKg: 100, photoKey: 'cabbage',     from, until });
  await upsertListing('lst-greenbeans-brits',    { farmerId: farmers['brits'].id, productId: green_beans.id,   price: 16.00, kg: 500,  minKg: 50,  photoKey: 'green-beans', from, until });
  await upsertListing('lst-tomato-brits',        { farmerId: farmers['brits'].id, productId: tomato.id,        gradeId: gradeToB.id, price: 5.80, kg: 1500, minKg: 100, photoKey: 'tomato', from, until });

  // ════════════════════════════════════════════════════════════════════════════
  // BUYER — Forti Restaurant Group (Sandton, Gauteng)
  // ════════════════════════════════════════════════════════════════════════════
  const sandtonOrg = await prisma.organization.upsert({ where: { id: 'org-forti' }, update: {}, create: { id: 'org-forti', name: 'Forti Restaurant Group', type: OrgType.RESTAURANT_GROUP } });
  const addr = await prisma.address.upsert({ where: { id: 'addr-sandton' }, update: {}, create: { id: 'addr-sandton', organizationId: sandtonOrg.id, line1: '12 Maude St', suburb: 'Sandton', city: 'Johannesburg', province: Province.GAUTENG, postalCode: '2196', gpsLat: -26.107, gpsLng: 28.056 } });
  const bUser = await prisma.user.upsert({ where: { email: 'buyer@demo.farmconnect.co.za' }, update: {}, create: { email: 'buyer@demo.farmconnect.co.za', passwordHash: pw, role: 'BUYER', phone: '+27721234567' } });
  const buyer = await prisma.buyer.upsert({ where: { userId: bUser.id }, update: {}, create: { userId: bUser.id, organizationId: sandtonOrg.id, displayName: 'Forti Sandton', buyerType: BuyerType.RESTAURANT, deliveryAddressId: addr.id, whatsappNumber: '+27721234567', ficaVerified: true, creditLimit: 50000, preferredPaymentTerms: 7 } });

  // ════════════════════════════════════════════════════════════════════════════
  // DEMO ORDERS (3 orders for the buyer UI demo)
  // ════════════════════════════════════════════════════════════════════════════
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
  await prisma.order.upsert({ where: { id: 'ord-demo-003' }, update: {}, create: {
    id: 'ord-demo-003', orderNumber: 'FC-2026-000003', buyerId: buyer.id,
    status: OrderStatus.CONFIRMED, deliveryDate: new Date(Date.now() + 2 * 86400000),
    totalFarmGateValue: 900, logisticsCharge: 225, deliveredPrice: 1620,
    paymentTermDays: 7, paymentDueDate: dueDate, source: 'WEB',
    items: { create: [{ listingId: 'lst-avocado-mahela', quantityKg: 50, farmGatePrice: 18.00, deliveredPrice: 32.40 }] },
  }});

  await prisma.payment.upsert({ where: { orderId: 'ord-demo-001' }, update: {}, create: { orderId: 'ord-demo-001', amount: 3200, method: 'INSTANT_EFT', status: PaymentStatus.PAID, paidAt: new Date(), dueDate } });
  await prisma.payment.upsert({ where: { orderId: 'ord-demo-002' }, update: {}, create: { orderId: 'ord-demo-002', amount: 2720, method: 'ACCOUNT_TO_ACCOUNT', status: PaymentStatus.PENDING, dueDate } });
  await prisma.payment.upsert({ where: { orderId: 'ord-demo-003' }, update: {}, create: { orderId: 'ord-demo-003', amount: 1620, method: 'INSTANT_EFT', status: PaymentStatus.PAID, paidAt: new Date(), dueDate } });

  await prisma.payout.upsert({ where: { id: 'pay-demo-001' }, update: {}, create: { id: 'pay-demo-001', orderId: 'ord-demo-001', farmerId: farmers['mahela'].id, grossAmount: 1100, commission: 55, netAmount: 1045, status: PayoutStatus.PAID, scheduledFor: new Date(Date.now() - 86400000), paidAt: new Date(Date.now() - 43200000) } });
  await prisma.payout.upsert({ where: { id: 'pay-demo-002' }, update: {}, create: { id: 'pay-demo-002', orderId: 'ord-demo-002', farmerId: farmers['zz2'].id, grossAmount: 930, commission: 46.50, netAmount: 883.50, status: PayoutStatus.PENDING, scheduledFor: new Date(Date.now() + 86400000) } });

  // ════════════════════════════════════════════════════════════════════════════
  // LOGISTICS
  // ════════════════════════════════════════════════════════════════════════════
  const n1Route = await prisma.logisticsRoute.upsert({ where: { id: 'route-n1-lgc' }, update: {}, create: { id: 'route-n1-lgc', name: 'N1 Limpopo–Gauteng Corridor', corridor: 'LIMPOPO_GAUTENG', departureTime: '04:00', estimatedHours: 7, isActive: true } });
  await prisma.logisticsRoute.upsert({ where: { id: 'route-n2-wc' }, update: {}, create: { id: 'route-n2-wc', name: 'N2 Cape Corridor (Gauteng)', corridor: 'WESTERN_CAPE_GAUTENG', departureTime: '05:00', estimatedHours: 14, isActive: true } });
  await prisma.logisticsRoute.upsert({ where: { id: 'route-n3-kzn' }, update: {}, create: { id: 'route-n3-kzn', name: 'N3 KZN–Gauteng Highway', corridor: 'KZN_GAUTENG', departureTime: '04:30', estimatedHours: 6, isActive: true } });
  await prisma.logisticsRoute.upsert({ where: { id: 'route-n4-mpu' }, update: {}, create: { id: 'route-n4-mpu', name: 'N4 Mpumalanga–Gauteng Corridor', corridor: 'MPUMALANGA_GAUTENG', departureTime: '03:00', estimatedHours: 4, isActive: true } });

  await prisma.delivery.upsert({ where: { orderId: 'ord-demo-001' }, update: { routeId: n1Route.id }, create: { orderId: 'ord-demo-001', routeId: n1Route.id, status: DeliveryStatus.DELIVERED, vehicleRef: 'FC-TRK-001', driverName: 'Sipho Dlamini', driverPhone: '+27721110001', collectionAt: new Date(Date.now() - 8 * 3600000), hubArrivalAt: new Date(Date.now() - 4 * 3600000), deliveredAt: new Date(Date.now() - 1 * 3600000) } });
  await prisma.delivery.upsert({ where: { orderId: 'ord-demo-002' }, update: { routeId: n1Route.id }, create: { orderId: 'ord-demo-002', routeId: n1Route.id, status: DeliveryStatus.AT_HUB, vehicleRef: 'FC-TRK-002', driverName: 'Themba Ndlovu', driverPhone: '+27721110002', collectionAt: new Date(Date.now() - 6 * 3600000), hubArrivalAt: new Date(Date.now() - 2 * 3600000) } });
  await prisma.delivery.upsert({ where: { orderId: 'ord-demo-003' }, update: { routeId: n1Route.id }, create: { orderId: 'ord-demo-003', routeId: n1Route.id, status: DeliveryStatus.SCHEDULED, vehicleRef: 'FC-TRK-001', driverName: 'Sipho Dlamini', driverPhone: '+27721110001' } });

  // ════════════════════════════════════════════════════════════════════════════
  // STAFF USERS
  // ════════════════════════════════════════════════════════════════════════════
  await prisma.user.upsert({ where: { email: 'sales@demo.farmconnect.co.za' }, update: {}, create: { email: 'sales@demo.farmconnect.co.za', passwordHash: pw, role: 'SALES_REP' } });
  await prisma.user.upsert({ where: { email: 'agent@demo.farmconnect.co.za' }, update: {}, create: { email: 'agent@demo.farmconnect.co.za', passwordHash: pw, role: 'FIELD_AGENT' } });
  await prisma.user.upsert({ where: { email: 'logistics@demo.farmconnect.co.za' }, update: {}, create: { email: 'logistics@demo.farmconnect.co.za', passwordHash: pw, role: 'LOGISTICS_COORDINATOR' } });

  // ════════════════════════════════════════════════════════════════════════════
  // GOVERNMENT BUYERS + TENDERS (B2G)
  // ════════════════════════════════════════════════════════════════════════════

  // ── Dept of Basic Education (School Feeding Programme) ─────────────────────
  const dbeOrg = await prisma.organization.upsert({ where: { id: 'org-dbe' }, update: {}, create: { id: 'org-dbe', name: 'Department of Basic Education', type: OrgType.GOVERNMENT, registrationNumber: 'GOV/DBE/001' } });
  const dbeAddr = await prisma.address.upsert({ where: { id: 'addr-dbe' }, update: {}, create: { id: 'addr-dbe', organizationId: dbeOrg.id, line1: '222 Struben St', suburb: 'Arcadia', city: 'Pretoria', province: Province.GAUTENG, postalCode: '0002', gpsLat: -25.747, gpsLng: 28.188 } });
  const dbeUser = await prisma.user.upsert({ where: { email: 'dbe@demo.farmconnect.co.za' }, update: {}, create: { email: 'dbe@demo.farmconnect.co.za', passwordHash: pw, role: 'GOV_BUYER' } });
  const dbeBuyer = await prisma.buyer.upsert({ where: { userId: dbeUser.id }, update: {}, create: { userId: dbeUser.id, organizationId: dbeOrg.id, displayName: 'DBE Procurement Office', buyerType: BuyerType.GOVERNMENT_SCHOOL, deliveryAddressId: dbeAddr.id, ficaVerified: true, preferredPaymentTerms: 30 } });

  // ── Dept of Health ─────────────────────────────────────────────────────────
  const dohOrg = await prisma.organization.upsert({ where: { id: 'org-doh' }, update: {}, create: { id: 'org-doh', name: 'Department of Health — Gauteng', type: OrgType.GOVERNMENT, registrationNumber: 'GOV/DOH/GP/001' } });
  const dohAddr = await prisma.address.upsert({ where: { id: 'addr-doh' }, update: {}, create: { id: 'addr-doh', organizationId: dohOrg.id, line1: '37 Sauer St', suburb: 'Marshalltown', city: 'Johannesburg', province: Province.GAUTENG, postalCode: '2001', gpsLat: -26.203, gpsLng: 28.045 } });
  const dohUser = await prisma.user.upsert({ where: { email: 'doh@demo.farmconnect.co.za' }, update: {}, create: { email: 'doh@demo.farmconnect.co.za', passwordHash: pw, role: 'GOV_BUYER' } });
  const dohBuyer = await prisma.buyer.upsert({ where: { userId: dohUser.id }, update: {}, create: { userId: dohUser.id, organizationId: dohOrg.id, displayName: 'DoH Gauteng Nutrition Services', buyerType: BuyerType.GOVERNMENT_HOSPITAL, deliveryAddressId: dohAddr.id, ficaVerified: true, preferredPaymentTerms: 30 } });

  // ── Dept of Correctional Services ─────────────────────────────────────────
  const dcsOrg = await prisma.organization.upsert({ where: { id: 'org-dcs' }, update: {}, create: { id: 'org-dcs', name: 'Department of Correctional Services', type: OrgType.GOVERNMENT, registrationNumber: 'GOV/DCS/001' } });
  const dcsAddr = await prisma.address.upsert({ where: { id: 'addr-dcs' }, update: {}, create: { id: 'addr-dcs', organizationId: dcsOrg.id, line1: '124 WF Nkomo St', suburb: 'Pretoria West', city: 'Pretoria', province: Province.GAUTENG, postalCode: '0001', gpsLat: -25.762, gpsLng: 28.148 } });
  const dcsUser = await prisma.user.upsert({ where: { email: 'dcs@demo.farmconnect.co.za' }, update: {}, create: { email: 'dcs@demo.farmconnect.co.za', passwordHash: pw, role: 'GOV_BUYER' } });
  const dcsBuyer = await prisma.buyer.upsert({ where: { userId: dcsUser.id }, update: {}, create: { userId: dcsUser.id, organizationId: dcsOrg.id, displayName: 'DCS Central Catering', buyerType: BuyerType.GOVERNMENT_CORRECTIONAL, deliveryAddressId: dcsAddr.id, ficaVerified: true, preferredPaymentTerms: 30 } });

  // ── Demo tenders ────────────────────────────────────────────────────────────
  const tClose1 = new Date(); tClose1.setDate(tClose1.getDate() + 14);
  const tClose2 = new Date(); tClose2.setDate(tClose2.getDate() + 7);
  const tClose3 = new Date(); tClose3.setDate(tClose3.getDate() + 21);
  const tClose4 = new Date(); tClose4.setDate(tClose4.getDate() + 5);
  const tDeliv1 = new Date(); tDeliv1.setDate(tDeliv1.getDate() + 45);
  const tDeliv2 = new Date(); tDeliv2.setDate(tDeliv2.getDate() + 30);
  const tDeliv3 = new Date(); tDeliv3.setDate(tDeliv3.getDate() + 60);

  const t1 = await prisma.tender.upsert({ where: { referenceNumber: 'TND-2026-0001' }, update: {}, create: {
    referenceNumber: 'TND-2026-0001', buyerId: dbeBuyer.id,
    title: 'School Nutrition Programme — Term 3 Tomatoes',
    description: 'Supply of fresh round tomatoes for the National School Nutrition Programme across 48 Gauteng schools for Term 3 (July–September 2026). Tomatoes must be Grade B or higher, delivered weekly in 10 kg crates. Smallholder cooperatives are encouraged to apply.',
    department: 'Department of Basic Education',
    productCategory: 'VEGETABLES',
    quantityKg: 5000, deliveryDate: tDeliv1, deliveryProvince: Province.GAUTENG,
    deliveryAddress: 'FarmConnect Hub, 14 Industrial Rd, Germiston, Gauteng',
    budgetPerKg: 4.50, closingDate: tClose1, status: 'OPEN',
    requiresBbbee: true, requiresHaccp: false, requiresTaxClear: true,
    notes: 'Preference will be given to Level 1–4 B-BBEE suppliers and smallholder cooperatives.',
  }});

  const t2 = await prisma.tender.upsert({ where: { referenceNumber: 'TND-2026-0002' }, update: {}, create: {
    referenceNumber: 'TND-2026-0002', buyerId: dbeBuyer.id,
    title: 'School Nutrition Programme — Term 3 Potatoes',
    description: 'Supply of washed table potatoes (minimum 60mm diameter) for school kitchens across Ekurhuleni district. Delivery to 3 central collection points. Fortnightly delivery schedule.',
    department: 'Department of Basic Education',
    productCategory: 'VEGETABLES',
    quantityKg: 3000, deliveryDate: tDeliv1, deliveryProvince: Province.GAUTENG,
    deliveryAddress: 'FarmConnect Hub, 14 Industrial Rd, Germiston, Gauteng',
    budgetPerKg: 3.80, closingDate: tClose2, status: 'OPEN',
    requiresBbbee: true, requiresHaccp: false, requiresTaxClear: true,
  }});

  const t3 = await prisma.tender.upsert({ where: { referenceNumber: 'TND-2026-0003' }, update: {}, create: {
    referenceNumber: 'TND-2026-0003', buyerId: dohBuyer.id,
    title: 'Hospital Nutrition Services — Mixed Vegetable Basket Q3',
    description: 'Quarterly supply of mixed fresh vegetables for patient nutrition at Charlotte Maxeke Academic Hospital and 4 district hospitals. Basket includes: cabbage, carrots, onions, spinach, and butternut. HACCP certification required.',
    department: 'Department of Health — Gauteng',
    productCategory: 'VEGETABLES',
    quantityKg: 8000, deliveryDate: tDeliv2, deliveryProvince: Province.GAUTENG,
    deliveryAddress: 'Charlotte Maxeke Academic Hospital, Jubilee Rd, Parktown',
    budgetPerKg: 7.50, closingDate: tClose1, status: 'EVALUATION',
    requiresBbbee: true, requiresHaccp: true, requiresTaxClear: true,
    notes: 'HACCP or ISO 22000 certification is mandatory. Proof of cold-chain capability required.',
  }});

  const t4 = await prisma.tender.upsert({ where: { referenceNumber: 'TND-2026-0004' }, update: {}, create: {
    referenceNumber: 'TND-2026-0004', buyerId: dcsBuyer.id,
    title: 'DCS Central Kitchen — Citrus Supply H2 2026',
    description: 'Supply of Valencia oranges for inmate nutrition across 6 correctional facilities in Gauteng for the second half of 2026. Monthly delivery required. Supplier must be able to maintain consistent supply volume.',
    department: 'Department of Correctional Services',
    productCategory: 'FRUIT',
    quantityKg: 6000, deliveryDate: tDeliv3, deliveryProvince: Province.GAUTENG,
    deliveryAddress: 'Kgosi Mampuru II Correctional Centre, Pretoria',
    budgetPerKg: 4.00, closingDate: tClose3, status: 'OPEN',
    requiresBbbee: true, requiresHaccp: false, requiresTaxClear: true,
    notes: 'Minimum commitment of 500 kg per monthly delivery. Volume discounts welcomed.',
  }});

  const t5 = await prisma.tender.upsert({ where: { referenceNumber: 'TND-2026-0005' }, update: {}, create: {
    referenceNumber: 'TND-2026-0005', buyerId: dohBuyer.id,
    title: 'Hospital Fresh Fruit Initiative — Avocados & Bananas',
    description: 'Supply of Hass avocados and Cavendish bananas for patient nutrition programme at 3 Johannesburg hospitals. Preference for smallholder suppliers from KwaZulu-Natal and Mpumalanga.',
    department: 'Department of Health — Gauteng',
    productCategory: 'FRUIT',
    quantityKg: 2000, deliveryDate: tDeliv2, deliveryProvince: Province.GAUTENG,
    deliveryAddress: 'Helen Joseph Hospital, Perth Rd, Auckland Park, JHB',
    budgetPerKg: 16.00, closingDate: tClose4, status: 'OPEN',
    requiresBbbee: true, requiresHaccp: false, requiresTaxClear: true,
  }});

  // ── Demo bids ───────────────────────────────────────────────────────────────
  const mkBid = (type: string, label: string, farmerId: string) => ({
    type, label, url: `mock://compliance/${farmerId}/${type.toLowerCase()}`, uploadedAt: new Date().toISOString(), verified: true,
  });

  // Tender 1 — tomatoes: 2 bids (mahela SHORTLISTED, mog SUBMITTED)
  await prisma.tenderBid.upsert({ where: { tenderId_farmerId: { tenderId: t1.id, farmerId: farmers['mahela'].id } }, update: {}, create: {
    tenderId: t1.id, farmerId: farmers['mahela'].id,
    pricePerKg: 4.20, quantityKg: 5000, status: 'SHORTLISTED', evaluatedAt: new Date(),
    notes: 'Grade B certified. Can deliver in 10 kg crates. Weekly harvest schedule aligns with programme.',
    complianceDocs: [mkBid('BBBEE_CERTIFICATE', 'B-BBEE Level 2 Certificate (Valid to Dec 2026)', farmers['mahela'].id), mkBid('TAX_CLEARANCE', 'SARS Tax Clearance — Good Standing', farmers['mahela'].id), mkBid('COMPANY_REGISTRATION', 'CIPC Registration Certificate', farmers['mahela'].id)],
    submittedAt: new Date(Date.now() - 5 * 86400000),
  }});
  await prisma.tenderBid.upsert({ where: { tenderId_farmerId: { tenderId: t1.id, farmerId: farmers['mog'].id } }, update: {}, create: {
    tenderId: t1.id, farmerId: farmers['mog'].id,
    pricePerKg: 4.35, quantityKg: 4000, status: 'SUBMITTED',
    notes: 'Smallholder cooperative, 12 members. B-BBEE Level 1. Limited to 4,000 kg but flexible on delivery schedule.',
    complianceDocs: [mkBid('BBBEE_CERTIFICATE', 'B-BBEE Level 1 Certificate', farmers['mog'].id), mkBid('TAX_CLEARANCE', 'SARS Tax Clearance', farmers['mog'].id)],
    submittedAt: new Date(Date.now() - 3 * 86400000),
  }});

  // Tender 2 — potatoes: 1 bid (freestate SUBMITTED)
  await prisma.tenderBid.upsert({ where: { tenderId_farmerId: { tenderId: t2.id, farmerId: farmers['freestate'].id } }, update: {}, create: {
    tenderId: t2.id, farmerId: farmers['freestate'].id,
    pricePerKg: 3.60, quantityKg: 3000, status: 'SUBMITTED',
    notes: 'Washed and graded at source. Cold storage on-site. Fortnightly delivery confirmed.',
    complianceDocs: [mkBid('BBBEE_CERTIFICATE', 'B-BBEE Level 3 Certificate', farmers['freestate'].id), mkBid('TAX_CLEARANCE', 'SARS Tax Clearance', farmers['freestate'].id)],
    submittedAt: new Date(Date.now() - 2 * 86400000),
  }});

  // Tender 3 — mixed veg EVALUATION: 3 bids (mog SHORTLISTED, freestate SUBMITTED, brits REJECTED)
  await prisma.tenderBid.upsert({ where: { tenderId_farmerId: { tenderId: t3.id, farmerId: farmers['mog'].id } }, update: {}, create: {
    tenderId: t3.id, farmerId: farmers['mog'].id,
    pricePerKg: 6.80, quantityKg: 8000, status: 'SHORTLISTED', evaluatedAt: new Date(Date.now() - 86400000),
    notes: 'Cooperative can supply full basket: cabbage, carrots, onions, spinach, butternut. ISO 22000 pending.',
    complianceDocs: [mkBid('BBBEE_CERTIFICATE', 'B-BBEE Level 1 Certificate', farmers['mog'].id), mkBid('TAX_CLEARANCE', 'SARS Tax Clearance', farmers['mog'].id), mkBid('HACCP_CERTIFICATE', 'ISO 22000:2018 Certification (Pending)', farmers['mog'].id)],
    submittedAt: new Date(Date.now() - 7 * 86400000),
  }});
  await prisma.tenderBid.upsert({ where: { tenderId_farmerId: { tenderId: t3.id, farmerId: farmers['freestate'].id } }, update: {}, create: {
    tenderId: t3.id, farmerId: farmers['freestate'].id,
    pricePerKg: 7.20, quantityKg: 6000, status: 'SUBMITTED',
    notes: 'Can supply all items except spinach. Partnering with Cullinan cooperative for spinach component.',
    complianceDocs: [mkBid('BBBEE_CERTIFICATE', 'B-BBEE Level 3 Certificate', farmers['freestate'].id), mkBid('TAX_CLEARANCE', 'SARS Tax Clearance', farmers['freestate'].id), mkBid('HACCP_CERTIFICATE', 'HACCP Certification (Food Safety Initiative)', farmers['freestate'].id)],
    submittedAt: new Date(Date.now() - 6 * 86400000),
  }});
  await prisma.tenderBid.upsert({ where: { tenderId_farmerId: { tenderId: t3.id, farmerId: farmers['brits'].id } }, update: {}, create: {
    tenderId: t3.id, farmerId: farmers['brits'].id,
    pricePerKg: 7.90, quantityKg: 5000, status: 'REJECTED', evaluatedAt: new Date(Date.now() - 86400000),
    notes: 'Price above budget threshold.',
    complianceDocs: [mkBid('BBBEE_CERTIFICATE', 'B-BBEE Level 4 Certificate', farmers['brits'].id), mkBid('TAX_CLEARANCE', 'SARS Tax Clearance', farmers['brits'].id)],
    submittedAt: new Date(Date.now() - 8 * 86400000),
  }});

  // Tender 5 — avocados/bananas: 1 bid (natal SUBMITTED)
  await prisma.tenderBid.upsert({ where: { tenderId_farmerId: { tenderId: t5.id, farmerId: farmers['natal'].id } }, update: {}, create: {
    tenderId: t5.id, farmerId: farmers['natal'].id,
    pricePerKg: 14.50, quantityKg: 2000, status: 'SUBMITTED',
    notes: 'Supply split: 1,200 kg Hass avocados, 800 kg Cavendish bananas. Midlands smallholder cooperative. Can increase volume with 2 weeks notice.',
    complianceDocs: [mkBid('BBBEE_CERTIFICATE', 'B-BBEE Level 2 Certificate', farmers['natal'].id), mkBid('TAX_CLEARANCE', 'SARS Tax Clearance', farmers['natal'].id)],
    submittedAt: new Date(Date.now() - 1 * 86400000),
  }});

  // ════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════════════════
  // COMPLIANCE VAULT — demo docs for key farmers
  // ════════════════════════════════════════════════════════════════════════════
  type DocDef = { type: ComplianceDocType; label: string; status: ComplianceDocStatus; expiresAt?: Date; rejectionNote?: string };
  const mkDoc = (farmerId: string, def: DocDef) => prisma.complianceDoc.upsert({
    where: { farmerId_type: { farmerId, type: def.type } },
    update: { status: def.status, verifiedAt: def.status === 'VERIFIED' ? new Date() : null, rejectionNote: def.rejectionNote ?? null },
    create: {
      farmerId,
      type: def.type,
      label: def.label,
      fileUrl: `mock://r2/compliance/${farmerId}/${def.type.toLowerCase()}.pdf`,
      fileKey: `compliance/${farmerId}/${def.type.toLowerCase()}.pdf`,
      status: def.status,
      expiresAt: def.expiresAt,
      uploadedAt: new Date(Date.now() - 7 * 86400000),
      verifiedAt: def.status === 'VERIFIED' ? new Date(Date.now() - 2 * 86400000) : null,
      verifiedById: def.status === 'VERIFIED' ? 'admin-seed' : null,
      rejectionNote: def.rejectionNote,
    },
  });

  const mahelaF = farmers['mahela'];
  const zz2F    = farmers['zz2'];
  const mogF    = farmers['mog'];
  const natalF  = farmers['natal'];

  await Promise.all([
    // Mahela — fully compliant (all 3 required + HACCP)
    mkDoc(mahelaF.id, { type: ComplianceDocType.BBBEE_CERTIFICATE,    label: 'B-BBEE Level 2 Certificate',          status: ComplianceDocStatus.VERIFIED, expiresAt: new Date('2027-03-31') }),
    mkDoc(mahelaF.id, { type: ComplianceDocType.TAX_CLEARANCE,        label: 'SARS Tax Clearance PIN',               status: ComplianceDocStatus.VERIFIED, expiresAt: new Date('2026-11-30') }),
    mkDoc(mahelaF.id, { type: ComplianceDocType.HACCP_CERTIFICATE,    label: 'HACCP Food Safety Certificate',        status: ComplianceDocStatus.VERIFIED, expiresAt: new Date('2027-06-30') }),
    mkDoc(mahelaF.id, { type: ComplianceDocType.COMPANY_REGISTRATION, label: 'CIPC Registration — Mahela Coop',     status: ComplianceDocStatus.VERIFIED }),

    // ZZ2 — BBBEE verified, tax clearance pending, HACCP rejected
    mkDoc(zz2F.id, { type: ComplianceDocType.BBBEE_CERTIFICATE, label: 'B-BBEE Level 1 Certificate',   status: ComplianceDocStatus.VERIFIED, expiresAt: new Date('2027-01-31') }),
    mkDoc(zz2F.id, { type: ComplianceDocType.TAX_CLEARANCE,     label: 'SARS Tax Clearance',            status: ComplianceDocStatus.PENDING }),
    mkDoc(zz2F.id, { type: ComplianceDocType.HACCP_CERTIFICATE, label: 'HACCP Certification',           status: ComplianceDocStatus.REJECTED, rejectionNote: 'Certificate expired — please upload current version dated after Jan 2026.' }),

    // Mogalakwena — only BBBEE uploaded (pending), tax clearance missing
    mkDoc(mogF.id, { type: ComplianceDocType.BBBEE_CERTIFICATE, label: 'B-BBEE Level 3 Certificate', status: ComplianceDocStatus.PENDING }),

    // KZN Natal — fully compliant
    mkDoc(natalF.id, { type: ComplianceDocType.BBBEE_CERTIFICATE,    label: 'B-BBEE Level 2 Certificate',   status: ComplianceDocStatus.VERIFIED, expiresAt: new Date('2027-05-31') }),
    mkDoc(natalF.id, { type: ComplianceDocType.TAX_CLEARANCE,        label: 'SARS Tax Clearance PIN',        status: ComplianceDocStatus.VERIFIED, expiresAt: new Date('2026-12-31') }),
    mkDoc(natalF.id, { type: ComplianceDocType.COMPANY_REGISTRATION, label: 'CIPC Registration — uMngeni', status: ComplianceDocStatus.VERIFIED }),
  ]);

  console.log('Demo seed complete ✓');
  console.log('');
  console.log('  Products:   40 (20 vegetables + 20 fruits)');
  console.log('');
  console.log('  LIMPOPO     mahela@demo, zz2@demo, mog@demo');
  console.log('  WESTERN CAPE  bergriver@demo, stellenbosch@demo');
  console.log('  KWAZULU-NATAL natal@demo, midlands@demo');
  console.log('  MPUMALANGA  hazyview@demo, lowveld@demo');
  console.log('  EASTERN CAPE  sundays@demo');
  console.log('  NORTHERN CAPE kalahari@demo');
  console.log('  FREE STATE  freestate@demo');
  console.log('  GAUTENG     cullinan@demo');
  console.log('  NORTH WEST  brits@demo');
  console.log('  (all passwords: demo1234)');
  console.log('');
  console.log('  Listings:   52 active across all 9 provinces');
  console.log('  Buyer:      buyer@demo.farmconnect.co.za');
  console.log('  Gov Buyers: dbe@demo (School Feeding), doh@demo (Health), dcs@demo (Correctional)');
  console.log('  Tenders:    5 (3 OPEN, 1 EVALUATION, 1 OPEN with no bids)');
  console.log('  Orders:     3 demo orders (delivered / at-hub / confirmed)');
  console.log('  Compliance: Mahela (fully verified), ZZ2 (mixed), Mog (pending), Natal (verified)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
