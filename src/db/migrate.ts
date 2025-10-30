#!/usr/bin/env tsx

/**
 * Database Migration Script
 * 
 * Runs Prisma migrations to set up the database schema
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function migrate() {
  console.log('\n🗄️  Running database migrations...\n');

  try {
    // Run Prisma migrations
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    console.log(stdout);
    if (stderr) console.error(stderr);

    // Generate Prisma Client
    const { stdout: genStdout, stderr: genStderr } = await execAsync('npx prisma generate');
    console.log(genStdout);
    if (genStderr) console.error(genStderr);

    console.log('\n✅ Migrations complete!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

