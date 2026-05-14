import { PrismaClient, ProductCategory, UnitType, QualityGrade } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Products
  const tomato = await prisma.product.upsert({
    where: { id: 'prod-tomato-round' },
    update: {},
    create: {
      id: 'prod-tomato-round',
      name: 'Tomatoes (Round)',
      category: ProductCategory.VEGETABLES,
      unitType: UnitType.KG,
    },
  });

  await prisma.product.upsert({
    where: { id: 'prod-avocado-hass' },
    update: {},
    create: {
      id: 'prod-avocado-hass',
      name: 'Avocados (Hass)',
      category: ProductCategory.FRUIT,
      unitType: UnitType.KG,
    },
  });

  await prisma.product.upsert({
    where: { id: 'prod-pepper-green' },
    update: {},
    create: {
      id: 'prod-pepper-green',
      name: 'Peppers (Green)',
      category: ProductCategory.VEGETABLES,
      unitType: UnitType.KG,
    },
  });

  // Tomato grade standards
  await prisma.produceGrade.upsert({
    where: { id: 'grade-tomato-a' },
    update: {},
    create: {
      id: 'grade-tomato-a',
      productId: tomato.id,
      grade: QualityGrade.A,
      description: 'Export quality — uniform size, no blemishes, firm, export colour',
      minSizeG: 80,
      maxBlemishPct: 0,
    },
  });

  await prisma.produceGrade.upsert({
    where: { id: 'grade-tomato-b' },
    update: {},
    create: {
      id: 'grade-tomato-b',
      productId: tomato.id,
      grade: QualityGrade.B,
      description: 'Restaurant quality — minor surface marks (<5% skin), uniform size ±15%',
      minSizeG: 60,
      maxBlemishPct: 5,
    },
  });

  await prisma.produceGrade.upsert({
    where: { id: 'grade-tomato-c' },
    update: {},
    create: {
      id: 'grade-tomato-c',
      productId: tomato.id,
      grade: QualityGrade.C,
      description: 'Processing grade — surface blemishes, size variation >15%, food-safe',
      maxBlemishPct: 20,
    },
  });

  // Admin user
  const passwordHash = await bcrypt.hash('admin-change-me', 12);
  await prisma.user.upsert({
    where: { email: 'admin@farmconnect.co.za' },
    update: {},
    create: {
      email: 'admin@farmconnect.co.za',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
