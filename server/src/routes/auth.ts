import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await prisma.user.findUnique({ 
      where: { email }, 
      include: { role: true } 
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
        role: user.role.name 
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
    if (roleName === 'CLIENT' || roleName === 'ADMIN') {
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

    return res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: role.name 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'An error occurred during registration' });
  }
});

export default router;
