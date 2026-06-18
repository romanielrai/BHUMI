import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken, requireAuth, json } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, roleName, phoneNumber, businessName } = await req.json();
    if (!email || !password || !roleName) {
      return json({ error: 'Email, password, and role are required' }, 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return json({ error: 'A user with this email already exists' }, 400);

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return json({ error: `Invalid role: ${roleName}` }, 400);

    const passwordHash = await bcrypt.hash(password, 12);

    let clientId: string | undefined = undefined;
    if (['CLIENT', 'ADMIN', 'USER'].includes(roleName)) {
      const client = await prisma.client.create({
        data: {
          companyName: businessName || 'My Business',
          contactName: name || 'Client User',
          contactEmail: email,
          contactPhone: phoneNumber || '',
          plan: 'GROWTH',
          status: 'ACTIVE',
        },
      });
      clientId = client.id;
    }

    const user = await prisma.user.create({
      data: { email, name, passwordHash, roleId: role.id, clientId },
    });

    return json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role.name,
        phone: phoneNumber || '',
        business: businessName || '',
        agentId: user.agentId || '',
        clientId: user.clientId || '',
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return json({ error: 'An error occurred during registration' }, 500);
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true, client: true },
    });
    if (!dbUser) return json({ error: 'User not found' }, 404);

    return json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role?.name,
        phone: dbUser.phone || dbUser.client?.contactPhone || '',
        business: dbUser.client?.companyName || '',
        agentId: dbUser.agentId || '',
        clientId: dbUser.clientId || '',
      },
    });
  } catch (err: any) {
    return json({ error: 'Failed to fetch profile' }, 500);
  }
}
