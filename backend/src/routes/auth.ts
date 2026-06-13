import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await prisma.user.findUnique({ 
      where: { email }, 
      include: { role: true, client: true } 
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name },
      process.env.JWT_SECRET ?? 'secret',
      { expiresIn: '7d' }
    );

    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role.name,
        phone: user.client?.contactPhone || '',
        business: user.client?.companyName || ''
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, roleName, phoneNumber, businessName } = req.body;
    if (!email || !password || !roleName) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return res.status(400).json({ error: `Invalid role: ${roleName}` });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let clientId: string | undefined = undefined;
    if (roleName === 'CLIENT' || roleName === 'ADMIN' || roleName === 'USER') {
      const client = await prisma.client.create({
        data: {
          companyName: businessName || 'My Business',
          contactName: name || 'Client User',
          contactEmail: email,
          contactPhone: phoneNumber || '',
          plan: 'GROWTH'
        }
      });
      clientId = client.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        roleId: role.id,
        clientId
      }
    });

    const client = clientId ? await prisma.client.findUnique({ where: { id: clientId } }) : null;

    return res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: role.name,
        phone: client?.contactPhone || '',
        business: client?.companyName || ''
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'An error occurred during registration' });
  }
});

router.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { role: true, client: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        phone: user.client?.contactPhone || '',
        business: user.client?.companyName || ''
      }
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ error: 'An error occurred fetching profile details' });
  }
});

router.patch('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, business, password } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { client: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true, client: true }
    });

    if (updatedUser.clientId) {
      const clientUpdate: any = {};
      if (business !== undefined) clientUpdate.companyName = business;
      if (name !== undefined) clientUpdate.contactName = name;
      if (email !== undefined) clientUpdate.contactEmail = email;
      if (phone !== undefined) clientUpdate.contactPhone = phone;

      await prisma.client.update({
        where: { id: updatedUser.clientId },
        data: clientUpdate
      });
    }

    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role.name },
      process.env.JWT_SECRET ?? 'secret',
      { expiresIn: '7d' }
    );

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PROFILE',
        actor: updatedUser.email,
        details: 'User updated profile details successfully',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role.name,
        phone: updatedUser.client?.contactPhone || phone || '',
        business: updatedUser.client?.companyName || business || ''
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'An error occurred while updating profile details' });
  }
});

export default router;
