/**
 * Authentication Service
 * 
 * Handles user authentication, password hashing, and session management
 */

import { PrismaClient, Role } from '@prisma/client';
import { randomBytes, createHash, pbkdf2Sync } from 'crypto';

const prisma = new PrismaClient();

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash password using PBKDF2
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password
 */
function verifyPassword(password: string, hash: string): boolean {
  const [salt, hashValue] = hash.split(':');
  const verifyHash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hashValue === verifyHash;
}

/**
 * Generate session token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: Role = Role.CLIENT,
  businessName?: string,
  logoUrl?: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      businessName,
      logoUrl,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessName: user.businessName,
    logoUrl: user.logoUrl,
  };
}

/**
 * Authenticate user and create session
 */
export async function login(email: string, password: string, ipAddress?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  let loginSuccess = false;
  let userId: string | undefined;

  if (user) {
    userId = user.id;
    if (user.isActive && verifyPassword(password, user.passwordHash)) {
      loginSuccess = true;
    }
  }

  // Log login attempt
  await prisma.loginLog.create({
    data: {
      userId: userId || '',
      email: email.toLowerCase(),
      success: loginSuccess,
      ipAddress,
      userAgent,
    },
  });

  if (!user || !user.isActive) {
    throw new Error('Invalid email or password');
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error('Invalid email or password');
  }

  // Create session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Clean up expired sessions
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    expiresAt,
  };
}

/**
 * Verify session token
 */
export async function verifySession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    userId: session.userId,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    token: session.token,
  };
}

/**
 * Logout (delete session)
 */
export async function logout(token: string) {
  await prisma.session.deleteMany({
    where: { token },
  });
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    role?: Role;
    isActive?: boolean;
    password?: string;
    businessName?: string | null;
    logoUrl?: string | null;
  }
) {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email.toLowerCase();
  if (data.role) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) updateData.passwordHash = hashPassword(data.password);
  if (data.businessName !== undefined) updateData.businessName = data.businessName;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      businessName: true,
      logoUrl: true,
    },
  });
}

/**
 * Delete user
 */
export async function deleteUser(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Create impersonation session (admin/employee only)
 */
export async function createImpersonationSession(adminUserId: string, targetUserId: string) {
  // Verify admin has permission
  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
  });

  if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'EMPLOYEE')) {
    throw new Error('Insufficient permissions for impersonation');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error('Target user not found');
  }

  // Create session with impersonation flag
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const session = await prisma.session.create({
    data: {
      userId: targetUserId,
      token,
      expiresAt,
    },
  });

  return {
    token,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    },
    impersonatedBy: adminUserId,
    expiresAt,
  };
}

/**
 * Request password reset - creates a reset token
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Don't reveal if user exists or not (security best practice)
  if (!user || !user.isActive) {
    return null;
  }

  // Generate reset token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

  // Invalidate any existing reset tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      used: false,
    },
    data: {
      used: true,
    },
  });

  // Create new reset token
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Reset password using token
 */
export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    throw new Error('Invalid or expired reset token');
  }

  if (resetToken.used) {
    throw new Error('Reset token has already been used');
  }

  if (resetToken.expiresAt < new Date()) {
    throw new Error('Reset token has expired');
  }

  if (!resetToken.user.isActive) {
    throw new Error('User account is inactive');
  }

  // Update password
  const passwordHash = hashPassword(newPassword);
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  });

  // Invalidate all existing sessions for security
  await prisma.session.deleteMany({
    where: { userId: resetToken.userId },
  });

  return {
    email: resetToken.user.email,
    name: resetToken.user.name,
  };
}

/**
 * Clean up expired reset tokens (call periodically)
 */
export async function cleanupExpiredResetTokens() {
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true },
      ],
    },
  });
}

/**
 * End impersonation - return to admin session
 */
export async function endImpersonation(impersonationToken: string, originalAdminUserId: string) {
  // Delete impersonation session
  await prisma.session.deleteMany({
    where: { token: impersonationToken },
  });

  // Get original admin session or create new one
  const adminSessions = await prisma.session.findMany({
    where: { userId: originalAdminUserId },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (adminSessions.length > 0) {
    const adminSession = adminSessions[0];
    if (adminSession.expiresAt > new Date()) {
      return {
        token: adminSession.token,
        user: await prisma.user.findUnique({ where: { id: originalAdminUserId } }),
      };
    }
  }

  // Create new admin session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.session.create({
    data: {
      userId: originalAdminUserId,
      token,
      expiresAt,
    },
  });

  const admin = await prisma.user.findUnique({ where: { id: originalAdminUserId } });
  return {
    token,
    user: admin,
  };
}
