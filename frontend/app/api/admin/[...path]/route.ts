import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole, json } from '@/lib/auth';
import { getConfigs, updateConfigs } from '@/lib/config-store';

async function checkAdmin(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return { error: auth.error };
  const forbidden = requireRole(auth.user, ['SUPERADMIN', 'ADMIN']);
  if (forbidden) return { error: forbidden };
  return { user: auth.user };
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const check = await checkAdmin(req);
  if ('error' in check) return check.error;

  const path = params.path.join('/');

  if (path === 'clients') {
    const clients = await prisma.client.findMany();
    return json({ clients });
  }

  if (path === 'calls') {
    const calls = await prisma.call.findMany({ orderBy: { createdAt: 'desc' }, include: { lead: true } });
    const defaultCalls = [
      {
        id: 'call-demo-1',
        leadName: 'James Carter',
        phone: '+1 (555) 0199',
        durationSec: 84,
        initiatedBy: 'system',
        outcome: 'BOOKED',
        createdAt: new Date(Date.now() - 600000).toISOString(),
        coaching: {
          greeting: 95, compliance: 90, sentiment: 'Positive',
          coachingNotes: 'Great call control. AI receptionist successfully handled emergency concerns.',
          transcript: '[AI]: Thanks for calling. How can I help?\n[Caller]: I have sewage backing up!\n[AI]: I can schedule a technician right away.',
        },
      },
      {
        id: 'call-demo-2',
        leadName: 'Sarah Miller',
        phone: '+1 (555) 0122',
        durationSec: 45,
        initiatedBy: 'agent',
        outcome: 'VOICEMAIL',
        createdAt: new Date(Date.now() - 2500000).toISOString(),
        coaching: {
          greeting: 85, compliance: 75, sentiment: 'Neutral',
          coachingNotes: 'AI left clear voicemail with callback link.',
          transcript: '[AI]: Hello, this is the callback assistant for AI Growth Systems...',
        },
      },
    ];
    const mapped = calls.map((c: any, i: number) => ({
      id: c.id,
      leadName: c.lead?.name || 'Inbound Caller',
      phone: c.lead?.phone || '+1 (555) 0100',
      durationSec: c.durationSec || 60,
      initiatedBy: c.initiatedBy,
      outcome: c.outcome,
      createdAt: c.createdAt,
      coaching: {
        greeting: 85 + (i * 7) % 15,
        compliance: 80 + (i * 3) % 20,
        sentiment: 'Positive',
        coachingNotes: 'AI responder handled lead qualifications with high script compliance.',
        transcript: '[AI]: Hello! Thanks for calling...',
      },
    }));
    return json({ calls: [...mapped, ...defaultCalls] });
  }

  if (path === 'appointments') {
    const appointments = await prisma.appointment.findMany({ orderBy: { scheduledAt: 'desc' } });
    return json({ appointments });
  }

  if (path === 'configs') {
    const configs = getConfigs();
    return json({ kbEntries: configs.kbEntries, voiceScript: configs.voiceProfile, systemPrompt: configs.systemPrompt, publisherNote: configs.publisherNote });
  }

  return json({ error: 'Not found' }, 404);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const check = await checkAdmin(req);
  if ('error' in check) return check.error;
  const { user } = check;

  const path = params.path.join('/');
  const body = await req.json().catch(() => ({}));

  if (path === 'clients') {
    const { companyName, contactName, contactEmail, contactPhone, plan } = body;
    if (!companyName || !contactEmail) return json({ error: 'Company Name and Contact Email are required' }, 400);
    const client = await prisma.client.create({
      data: { companyName, contactName: contactName || 'Contact Person', contactEmail, contactPhone: contactPhone || '', plan: plan || 'GROWTH', status: 'ACTIVE' },
    });
    await prisma.auditLog.create({
      data: { action: 'CREATE_CLIENT', actor: user.email, details: `Created client '${companyName}'`, ipAddress: '127.0.0.1' },
    });
    return json({ client });
  }

  if (path === 'configs') {
    const { kbEntries, voiceScript, systemPrompt, publisherNote } = body;
    const updates: any = {};
    if (kbEntries !== undefined) updates.kbEntries = kbEntries;
    if (voiceScript !== undefined) updates.voiceProfile = voiceScript;
    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;
    if (publisherNote !== undefined) updates.publisherNote = publisherNote;
    const configs = updateConfigs(updates);
    return json({ message: 'Settings updated successfully', kbEntries: configs.kbEntries, voiceScript: configs.voiceProfile, systemPrompt: configs.systemPrompt, publisherNote: configs.publisherNote });
  }

  return json({ error: 'Not found' }, 404);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  const check = await checkAdmin(req);
  if ('error' in check) return check.error;
  const { user } = check;

  const pathParts = params.path;
  const body = await req.json().catch(() => ({}));

  if (pathParts[0] === 'clients' && pathParts[1]) {
    const id = pathParts[1];
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return json({ error: 'Client not found' }, 404);
    const { companyName, contactName, contactEmail, contactPhone, plan, status } = body;
    const updateData: any = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (plan !== undefined) updateData.plan = plan;
    if (status !== undefined) updateData.status = status;
    const updated = await prisma.client.update({ where: { id }, data: updateData });
    return json({ client: updated });
  }

  if (pathParts[0] === 'appointments' && pathParts[1]) {
    const id = pathParts[1];
    const { status } = body;
    if (!status) return json({ error: 'Status is required' }, 400);
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) return json({ error: 'Appointment not found' }, 404);
    const updated = await prisma.appointment.update({ where: { id }, data: { status } });
    return json({ appointment: updated });
  }

  return json({ error: 'Not found' }, 404);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  const check = await checkAdmin(req);
  if ('error' in check) return check.error;
  const { user } = check;

  const pathParts = params.path;

  if (pathParts[0] === 'clients' && pathParts[1]) {
    const id = pathParts[1];
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return json({ error: 'Client not found' }, 404);
    await prisma.client.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { action: 'DELETE_CLIENT', actor: user.email, details: `Deleted client '${client.companyName}'`, ipAddress: '127.0.0.1' },
    });
    return json({ message: 'Client deleted successfully' });
  }

  return json({ error: 'Not found' }, 404);
}
