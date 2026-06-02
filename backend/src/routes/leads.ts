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

export default router;
