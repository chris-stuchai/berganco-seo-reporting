/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifySession } from '../services/auth-service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: string;
    token: string;
  };
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.sessionToken || 
                req.query?.token as string;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = await verifySession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  req.user = session;
  next();
}

/**
 * Middleware to require specific role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Optional auth - sets user if token present
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.sessionToken || 
                req.query?.token as string;

  if (token) {
    const session = await verifySession(token);
    if (session) {
      req.user = session;
    }
  }

  next();
}
