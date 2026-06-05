import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth & role requirements (both Superadmin and Admin are authorized)
router.use(requireAuth);
router.use(requireRole(['SUPERADMIN', 'ADMIN']));

// --- CLIENT MANAGEMENT ---

// List all clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany();
    return res.json({ clients });
  } catch (error: any) {
    console.error('Fetch clients error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch clients' });
  }
});

// Create a client
router.post('/clients', async (req: any, res) => {
  try {
    const { companyName, contactName, contactEmail, contactPhone, plan } = req.body;
    if (!companyName || !contactEmail) {
      return res.status(400).json({ error: 'Company Name and Contact Email are required' });
    }

    const client = await prisma.client.create({
      data: {
        companyName,
        contactName: contactName || 'Contact Person',
        contactEmail,
        contactPhone: contactPhone || '',
        plan: plan || 'GROWTH'
      }
    });

    // Write audit log
    await prisma.auditlog.create({
      data: {
        action: 'CREATE_CLIENT',
        actor: req.user?.email || 'admin',
        details: `Created client account '${companyName}' under '${plan}' plan`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({ client });
  } catch (error: any) {
    console.error('Create client error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create client' });
  }
});

// Update client details
router.patch('/clients/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { companyName, contactName, contactEmail, contactPhone, plan } = req.body;

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updateData: any = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (plan !== undefined) updateData.plan = plan;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData
    });

    // Write audit log
    await prisma.auditlog.create({
      data: {
        action: 'UPDATE_CLIENT',
        actor: req.user?.email || 'admin',
        details: `Updated client '${client.companyName}' details: ${JSON.stringify(updateData)}`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({ client: updatedClient });
  } catch (error: any) {
    console.error('Update client error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update client' });
  }
});

// --- APPOINTMENTS MANAGEMENT ---

// List all appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: { scheduledAt: 'desc' }
    });
    return res.json({ appointments });
  } catch (error: any) {
    console.error('Fetch appointments error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch appointments' });
  }
});

// Update appointment status (Confirm/Approve or Cancel)
router.patch('/appointments/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g. CONFIRMED, CANCELLED, PENDING

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updatedAppt = await prisma.appointment.update({
      where: { id },
      data: { status }
    });

    // Write audit log
    await prisma.auditlog.create({
      data: {
        action: 'UPDATE_APPOINTMENT',
        actor: req.user?.email || 'admin',
        details: `Changed appointment '${appt.title}' status to '${status}'`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({ appointment: updatedAppt });
  } catch (error: any) {
    console.error('Update appointment error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update appointment' });
  }
});

export default router;
