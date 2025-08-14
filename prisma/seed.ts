import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo user for development/testing
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      name: 'Demo User',
      plan: 'PRO', // Give demo user PRO access for testing
    },
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      plan: 'PRO',
    },
  });

  console.log('✅ Demo user created/updated:', {
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    plan: demoUser.plan,
  });

  // Create additional test users if needed
  const basicUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      name: 'Test User',
      plan: 'BASIC',
    },
    create: {
      email: 'test@example.com',
      name: 'Test User', 
      plan: 'BASIC',
    },
  });

  console.log('✅ Test user created/updated:', {
    id: basicUser.id,
    email: basicUser.email,
    name: basicUser.name,
    plan: basicUser.plan,
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });