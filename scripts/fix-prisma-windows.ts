import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function main() {
  console.log('🔧 Fixing Prisma Windows permission issues...\n');

  try {
    // Try to remove the problematic files
    const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
    
    if (fs.existsSync(prismaClientPath)) {
      console.log('🗑️ Removing existing Prisma client files...');
      try {
        fs.rmSync(prismaClientPath, { recursive: true, force: true });
        console.log('✅ Removed existing Prisma client');
      } catch (error) {
        console.log('⚠️ Could not remove all files, continuing...');
      }
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to generate again
    console.log('🔄 Generating Prisma client...');
    try {
      const { stdout, stderr } = await execAsync('npx prisma generate', { 
        timeout: 60000,
        cwd: process.cwd()
      });
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('EPERM')) console.warn(stderr);
      console.log('✅ Prisma client generated successfully!');
    } catch (error: any) {
      if (error.message.includes('EPERM')) {
        console.log('❌ Still getting permission errors. Try these solutions:');
        console.log('1. Close all IDEs and terminals');
        console.log('2. Run terminal as Administrator');
        console.log('3. Restart your computer if the issue persists');
        console.log('4. Use the alternative database viewer: npm run db:viewer');
      } else {
        throw error;
      }
    }

  } catch (error: any) {
    console.error('❌ Fix failed:', error.message);
  }
}

main();