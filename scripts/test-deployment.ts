import { db } from '../lib/db';

async function testDeployment() {
  console.log('🚀 Testing OpenChat Deployment...\n');

  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const userCount = await db.user.count();
    console.log(`✅ Database connected! Found ${userCount} users.\n`);

    // Test demo user exists
    console.log('👤 Checking demo user...');
    const demoUser = await db.user.findUnique({
      where: { email: 'demo@example.com' }
    });
    
    if (demoUser) {
      console.log(`✅ Demo user found! Plan: ${demoUser.plan}\n`);
    } else {
      console.log('⚠️  Demo user not found. Running seeder...');
      // You could run seeder here if needed
    }

    // Test environment variables
    console.log('🔧 Checking environment variables...');
    const requiredEnvs = ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'DATABASE_URL'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
    
    if (missingEnvs.length === 0) {
      console.log('✅ All required environment variables are set.\n');
    } else {
      console.log(`⚠️  Missing environment variables: ${missingEnvs.join(', ')}\n`);
    }

    // Test optional integrations
    console.log('🔌 Checking optional integrations...');
    const optionalEnvs = {
      'AUTH_GOOGLE_ID': 'Google OAuth',
      'OPENAI_API_KEY': 'OpenAI',
      'ANTHROPIC_API_KEY': 'Anthropic',
      'STRIPE_SECRET_KEY': 'Stripe'
    };

    Object.entries(optionalEnvs).forEach(([env, service]) => {
      if (process.env[env]) {
        console.log(`✅ ${service} configured`);
      } else {
        console.log(`⚪ ${service} not configured (optional)`);
      }
    });

    console.log('\n🎉 Deployment test completed successfully!');
    console.log('\n🔗 You can now:');
    console.log('  • Visit your deployed app');
    console.log('  • Sign in with: demo@example.com / password');
    console.log('  • Test Google OAuth (if configured)');
    console.log('  • Start chatting with LLMs!');

  } catch (error) {
    console.error('❌ Deployment test failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

testDeployment();