import { PrismaClient } from '@prisma/client';

let isInitialized = false;

export async function ensureDbInitialized() {
  if (isInitialized) return;

  try {
    const prisma = new PrismaClient();
    
    // Test database connection by trying to query users
    await prisma.user.findFirst();
    
    console.log('✅ Database connection verified');
    isInitialized = true;
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('💡 Run: npm run db:reset to initialize the database');
    throw error;
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  ensureDbInitialized().catch(() => {
    console.log('🚨 Database not initialized. Please run: npm run db:reset');
  });
}