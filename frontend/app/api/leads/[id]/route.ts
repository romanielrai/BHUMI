import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, json } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  try {
    const { id } = params;
    const { status, name, email, phone, business } = await req.json();

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return json({ error: 'Lead not found' }, 404);

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (business !== undefined) updateData.business = business;

    const updatedLead = await prisma.lead.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_LEAD',
        actor: user.email,
        details: `Updated lead '${lead.name}'`,
        ipAddress: '127.0.0.1',
      },
    });

    return json({ lead: updatedLead });
  } catch (err: any) {
    return json({ error: 'Failed to update lead' }, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  try {
    const { id } = params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return json({ error: 'Lead not found' }, 404);

    await prisma.lead.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_LEAD',
        actor: user.email,
        details: `Deleted lead '${lead.name}'`,
        ipAddress: '127.0.0.1',
      },
    });

    return json({ message: 'Lead deleted successfully' });
  } catch (err: any) {
    return json({ error: 'Failed to delete lead' }, 500);
  }
}
