import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, json } from '@/lib/auth';
import { getConfigs, getApiCallCount } from '@/lib/config-store';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  if (user.role === 'SUPERADMIN') {
    try {
      const [userCount, clientCount, leadCount] = await Promise.all([
        prisma.user.count(),
        prisma.client.count(),
        prisma.lead.count(),
      ]);
      return json({
        metrics: {
          totalUsers: userCount,
          activeClients: clientCount,
          totalLeads: leadCount,
          apiCallsToday: getApiCallCount(),
        },
      });
    } catch (err: any) {
      return json({ error: 'Failed to fetch dashboard metrics' }, 500);
    }
  }

  if (user.role === 'ADMIN') {
    try {
      const [leadCount, appointmentCount, callCount] = await Promise.all([
        prisma.lead.count(),
        prisma.appointment.count(),
        prisma.call.count(),
      ]);
      return json({
        metrics: {
          totalLeads: leadCount,
          appointmentsBooked: appointmentCount,
          callsAnswered: callCount,
          publisherNote: getConfigs().publisherNote,
        },
      });
    } catch (err: any) {
      return json({ error: 'Failed to fetch dashboard metrics' }, 500);
    }
  }

  // Client/agent dashboard
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const clientId = dbUser?.clientId;

    const [leadCount, appointmentCount, callCount, recoveredLeads] = await Promise.all([
      clientId ? prisma.lead.count({ where: { clientId } }) : prisma.lead.count(),
      clientId ? prisma.appointment.count({ where: { clientId } }) : prisma.appointment.count(),
      prisma.call.count(),
      clientId
        ? prisma.lead.count({ where: { clientId, status: 'CONTACTED' } })
        : prisma.lead.count({ where: { status: 'CONTACTED' } }),
    ]);

    return json({
      metrics: {
        leadsGenerated: leadCount,
        appointmentsBooked: appointmentCount,
        callsAnswered: callCount,
        recoveredLeads,
        publisherNote: getConfigs().publisherNote,
      },
    });
  } catch (err: any) {
    return json({ error: 'Failed to fetch dashboard metrics' }, 500);
  }
}
