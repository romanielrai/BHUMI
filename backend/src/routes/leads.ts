import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, business, source, clientId } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || '',
        business: business || '',
        source: source || 'Web Form',
        status: 'NEW',
        clientId: clientId || 'client-default'
      }
    });

    return res.json({ lead });
  } catch (error) {
    console.error('Lead creation error:', error);
    return res.status(500).json({ error: 'An error occurred while creating the lead' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const clientId = req.query.clientId as string | undefined;
    const filter = clientId ? { clientId } : {};
    const leads = await prisma.lead.findMany({ 
      where: filter, 
      orderBy: { createdAt: 'desc' } 
    });
    return res.json({ leads });
  } catch (error) {
    console.error('Leads fetch error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching leads' });
  }
});

// Update lead status/details
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, name, email, phone, business } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (business !== undefined) updateData.business = business;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData
    });

    // Write audit log
    await prisma.auditlog.create({
      data: {
        action: 'UPDATE_LEAD',
        actor: req.user?.email || 'user',
        details: `Updated status/info of lead '${lead.name}'`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({ lead: updatedLead });
  } catch (error) {
    console.error('Lead update error:', error);
    return res.status(500).json({ error: 'An error occurred while updating the lead' });
  }
});

// Delete lead
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await prisma.lead.delete({ where: { id } });

    // Write audit log
    await prisma.auditlog.create({
      data: {
        action: 'DELETE_LEAD',
        actor: req.user?.email || 'user',
        details: `Deleted lead record of '${lead.name}'`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Lead delete error:', error);
    return res.status(500).json({ error: 'An error occurred while deleting the lead' });
  }
});

export default router;
