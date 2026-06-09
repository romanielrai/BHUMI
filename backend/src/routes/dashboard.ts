import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { getConfigs } from '../config-store';

const router = Router();

router.get('/superadmin', requireAuth, requireRole('SUPERADMIN'), async (req, res) => {
  try {
    const [userCount, clientCount, leadCount] = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.lead.count()
    ]);

    return res.json({
      metrics: {
        totalUsers: userCount,
        activeClients: clientCount,
        totalLeads: leadCount,
        apiCallsToday: 0
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

router.get('/admin', requireAuth, requireRole(['SUPERADMIN', 'ADMIN']), async (req, res) => {
  try {
    const [leadCount, appointmentCount, callCount] = await Promise.all([
      prisma.lead.count(),
      prisma.appointment.count(),
      prisma.call.count()
    ]);

    return res.json({
      metrics: {
        totalLeads: leadCount,
        appointmentsBooked: appointmentCount,
        callsAnswered: callCount
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req as any).user.id } });
    const clientId = user?.clientId;
    
    let leadCount = 0;
    let appointmentCount = 0;
    let callCount = 0;
    let recoveredLeads = 0;

    if (clientId) {
      [leadCount, appointmentCount, callCount, recoveredLeads] = await Promise.all([
        prisma.lead.count({ where: { clientId } }),
        prisma.appointment.count({ where: { clientId } }),
        prisma.call.count({ where: { clientId } }),
        prisma.lead.count({ where: { clientId, status: 'CONTACTED' } })
      ]);
    } else {
        [leadCount, appointmentCount, callCount, recoveredLeads] = await Promise.all([
            prisma.lead.count(),
            prisma.appointment.count(),
            prisma.call.count(),
            prisma.lead.count({ where: { status: 'CONTACTED' } })
        ]);
    }

    return res.json({
      metrics: {
        leadsGenerated: leadCount,
        appointmentsBooked: appointmentCount,
        callsAnswered: callCount,
        recoveredLeads,
        publisherNote: getConfigs().publisherNote
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

export default router;
