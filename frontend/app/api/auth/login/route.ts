import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken, json } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, client: true },
    });

    if (!user) return json({ error: 'Invalid credentials' }, 401);
    if (user.suspended) return json({ error: 'Your account has been suspended. Contact support.' }, 403);

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return json({ error: 'Invalid credentials' }, 401);

    const token = signToken({ id: user.id, email: user.email, role: user.role?.name ?? 'USER' });

    return json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.name,
        phone: user.phone || user.client?.contactPhone || '',
        business: user.client?.companyName || '',
        agentId: user.agentId || '',
        clientId: user.clientId || '',
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return json({ error: 'An error occurred during login' }, 500);
  }
}
