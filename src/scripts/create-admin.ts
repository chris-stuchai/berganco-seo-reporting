/**
 * Create initial admin user
 * Run: npx tsx src/scripts/create-admin.ts
 */

import * as dotenv from 'dotenv';
import * as authService from '../services/auth-service';
import { Role } from '@prisma/client';

dotenv.config();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@berganco.com';
  const password = process.env.ADMIN_PASSWORD || 'changeme';
  const name = process.env.ADMIN_NAME || 'Admin User';

  try {
    const user = await authService.createUser(email, password, name, Role.ADMIN);
    console.log('✅ Admin user created:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Admin user already exists');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  }
}

createAdmin();
