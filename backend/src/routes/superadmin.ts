import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Modular in-memory configs that persist in server session
let systemConfigs = {
  openaiApiKey: process.env.OPENAI_API_KEY || 'mock-key',
  openaiModel: 'gpt-4o-mini',
  openaiTemperature: 0.3,
  systemPrompt: 'You are a high-ticket AI sales consultant for AI Growth Systems...',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || 'ACmock',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || 'mocktoken',
  twilioPhoneNumber: '+15550199',
  elevenLabsApiKey: 'mock-eleven-labs-key',
  voiceProfile: 'Rachel',
  crmConnected: {
    gohighlevel: true,
    hubspot: false,
    salesforce: false
  }
};

// Apply auth & role requirements to all routes in this controller
router.use(requireAuth);
router.use(requireRole('SUPERADMIN'));

// --- USER MANAGEMENT ---

// List all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    return res.json({ users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

// Create a user
router.post('/users', async (req: any, res) => {
  try {
    const { email, password, name, roleName } = req.body;
    if (!email || !password || !roleName) {
      return res.status(400).json({ error: 'Email, password, and roleName are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return res.status(400).json({ error: `Invalid role name: ${roleName}` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        roleId: role.id
      },
      include: { role: true }
    });

    // Write audit log
    await prisma.auditlog.create({
      data: {
        action: 'CREATE_USER',
        actor: req.user?.email || 'superadmin',
        details: `Successfully created user '${email}' with role '${roleName}'`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({ user });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

// Update a user (edit role, suspend status, name, etc.)
router.patch('/users/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, email, roleName, suspended } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (suspended !== undefined) updateData.suspended = suspended;

    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        return res.status(400).json({ error: `Invalid role name: ${roleName}` });
      }
      updateData.roleId = role.id;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true }
    });

    // Write audit log
    await prisma.auditlog.create({
      data: {
        action: 'UPDATE_USER',
        actor: req.user?.email || 'superadmin',
        details: `Updated user '${user.email}' details: ${JSON.stringify(updateData)}`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

// Delete a user
router.delete('/users/:id', async (req: any, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    // Write audit log
    await prisma.auditlog.create({
      data: {
        action: 'DELETE_USER',
        actor: req.user?.email || 'superadmin',
        details: `Deleted user '${user.email}'`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
});

// --- AUDIT LOGS ---
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditlog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
});

// --- CONVERSATION LOGS ---
router.get('/conversation-logs', async (req, res) => {
  try {
    const logs = await prisma.chatbotlog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch conversation logs' });
  }
});

// --- SYSTEM CONFIGS ---
router.get('/configs', (req, res) => {
  return res.json({ configs: systemConfigs });
});

router.post('/configs', async (req: any, res) => {
  try {
    const newConfigs = req.body;
    systemConfigs = { ...systemConfigs, ...newConfigs };

    // Write audit log
    await prisma.auditlog.create({
      data: {
        action: 'UPDATE_CONFIG',
        actor: req.user?.email || 'superadmin',
        details: 'System configurations updated by super administrator',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.json({ message: 'Configurations updated successfully', configs: systemConfigs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to save configurations' });
  }
});

// --- SYSTEM HEALTH ---
router.get('/system-health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  // Simulate active connections and queue response values
  return res.json({
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
    },
    metrics: {
      apiLatencyMs: Math.floor(Math.random() * 45) + 10,
      dbLatencyMs: Math.floor(Math.random() * 8) + 2,
      activeConnections: Math.floor(Math.random() * 12) + 4,
      queueSize: Math.floor(Math.random() * 3)
    }
  });
});

export default router;
