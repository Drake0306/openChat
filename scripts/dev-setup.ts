import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(command: string, description: string, retries = 1) {
  console.log(`🔄 ${description}...`);
  
  for (let i = 0; i <= retries; i++) {
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('EPERM')) console.warn(stderr);
      console.log(`✅ ${description} completed`);
      return;
    } catch (error: any) {
      if (i < retries) {
        console.log(`⚠️ Retrying ${description} (attempt ${i + 2}/${retries + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.error(`❌ ${description} failed:`, error.message);
        if (error.message.includes('EPERM')) {
          console.log('💡 Windows permission issue detected. Try running as administrator or close any IDEs/editors that might be using the files.');
        }
        throw error;
      }
    }
  }
}

async function main() {
  console.log('🚀 Setting up development environment...\n');

  try {
    // Generate Prisma client (with retries for Windows)
    await runCommand('npx prisma generate', 'Generating Prisma client', 2);

    // Push database schema (create tables if they don't exist)
    await runCommand('npx prisma db push', 'Applying database schema');

    // Run seeds
    await runCommand('npx tsx prisma/seed.ts', 'Running database seeds');

    console.log('\n✅ Development environment is ready!');
    console.log('🎉 You can now start the development server!\n');
  } catch (error) {
    console.error('\n❌ Setup failed. Some steps may have failed but you can still try running the dev server.');
    console.log('💡 If Prisma generation failed, try: npx prisma generate');
    console.log('💡 If database setup failed, try: npx prisma db push');
    console.log('💡 To run seeds manually: npm run db:seed\n');
  }
}

main();