import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'bhumi-didi-secret-key-2024';

export function signToken(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export interface JwtUser {
  id: string;
  email: string;
  role: string;
}

export function verifyToken(token: string): JwtUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload && payload.id && payload.role) {
      return { id: payload.id, email: payload.email, role: payload.role };
    }
    return null;
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): JwtUser | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyToken(token);
}

export function requireAuth(req: NextRequest): { user: JwtUser } | { error: Response } {
  const user = getUserFromRequest(req);
  if (!user) {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { user };
}

export function requireRole(user: JwtUser, roles: string | string[]): Response | null {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

export function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
