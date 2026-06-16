import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// --- SERVER-SENT EVENTS (SSE) EVENT BROKER ---
let activeClients: Response[] = [];

router.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write('data: {"type": "connected"}\n\n');
  activeClients.push(res);

  req.on('close', () => {
    activeClients = activeClients.filter(client => client !== res);
  });
});

export function broadcastEvent(event: any) {
  const data = JSON.stringify(event);
  activeClients.forEach(client => {
    client.write(`data: ${data}\n\n`);
  });
}

// Helper to push activity timeline log
async function pushActivity(userId: string, action: string, details: string) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details
      }
    });
    broadcastEvent({ type: 'ACTIVITY_LOG', userId, action, details });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// Helper to push notification
async function pushNotification(userId: string, title: string, message: string, channel: string = 'IN_APP') {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        channel
      }
    });
    broadcastEvent({ type: 'NOTIFICATION', userId, title, message });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

// --- CLIENT ENDPOINTS ---

// Upload Database simulation
router.post('/upload', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fileName, fileType, recordCount } = req.body;
    
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });
    const clientId = dbUser?.clientId || 'client-default';

    if (!fileName || !recordCount) {
      return res.status(400).json({ error: 'fileName and recordCount are required' });
    }

    // 1. Create Project
    const project = await prisma.project.create({
      data: {
        name: fileName.replace(/\.[^/.]+$/, "") + " Campaign",
        clientId,
        status: 'PENDING_APPROVAL',
        progress: 0
      }
    });

    // 2. Create UploadedFile
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName,
        fileType: fileType || 'CSV',
        recordCount: Number(recordCount),
        status: 'PENDING_APPROVAL',
        clientId,
        projectId: project.id
      }
    });

    // 3. Create simulated leads for this project
    const sampleNames = ['Marcus Aurelius', 'Seneca', 'Epictetus', 'Cicero', 'Plato', 'Socrates', 'Aristotle'];
    const sampleCompanies = ['Roman Stoics Ltd', 'Athens Academy', 'Stoic Life Inc', 'Tusculum Security', 'Platonic Ideas Corp', 'Socratic Questions', 'Lyceum Logistics'];
    
    for (let i = 0; i < Math.min(recordCount, 5); i++) {
      await prisma.lead.create({
        data: {
          name: sampleNames[i % sampleNames.length],
          company: sampleCompanies[i % sampleCompanies.length],
          phone: `555-010${i}`,
          email: `${sampleNames[i % sampleNames.length].toLowerCase().replace(' ', '')}@example.com`,
          notes: 'Simulated lead from CSV database upload.',
          status: 'NEW',
          projectId: project.id,
          clientId: clientId
        }
      });
    }

    // Log Activity & Create Alerts
    await pushActivity(req.user!.id, 'Database uploaded', `Database ${fileName} (${recordCount} records) uploaded successfully.`);
    
    // Notify Super Admin (first superadmin user)
    const superadmin = await prisma.user.findFirst({ where: { role: { name: 'SUPERADMIN' } } });
    if (superadmin) {
      await pushNotification(superadmin.id, 'New Database Uploaded', `Client has uploaded a new database "${fileName}" (${recordCount} records) pending approval.`);
    }

    // Notify Client
    await pushNotification(req.user!.id, 'Database Uploaded', `Your file "${fileName}" has been queued for Super Admin approval.`);

    res.json({ project, uploadedFile });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse database upload' });
  }
});

// --- NOTIFICATIONS ENDPOINTS ---

// Retrieve Client Notifications
router.get('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve notifications' });
  }
});

// Mark Notification as Read
router.patch('/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    res.json({ notification });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update notification' });
  }
});

// Voice AI Agent Test Call Simulation
router.post('/voice-test', async (req, res) => {
  try {
    const { phone, scenario, voiceType } = req.body;
    if (!phone || !scenario) {
      return res.status(400).json({ error: 'Phone number and scenario description are required' });
    }

    const testRecord = await prisma.voiceTest.create({
      data: {
        phone,
        scenario,
        voiceType: voiceType || 'Female Professional'
      }
    });

    // Generate simulated dynamic transcript based on client inputs
    const scenarioClean = scenario.toLowerCase();
    let trans = [];
    if (scenarioClean.includes('price') || scenarioClean.includes('cost') || scenarioClean.includes('expensive')) {
      trans = [
        { role: 'assistant', message: `Hello, this is the AI assistant in ${voiceType} voice mode. I saw you requested details on our pricing packages. How can I help you?` },
        { role: 'user', message: "Yes, I wanted to check the pricing. It seems a bit higher than other quotes I've got." },
        { role: 'assistant', message: `I completely understand that cost is key. However, our services include an all-inclusive warranty, immediate 24/7 callouts, and local technician dispatch with zero extra fees. Does that level of protection cover your requirements?` },
        { role: 'user', message: "Yes, actually. Having guaranteed fast dispatch saves us a lot of downtime. Let's do it." },
        { role: 'assistant', message: "Excellent! I have locked in your account activation. A quote breakdown is on its way to your cell." }
      ];
    } else if (scenarioClean.includes('schedule') || scenarioClean.includes('time') || scenarioClean.includes('appointment')) {
      trans = [
        { role: 'assistant', message: `Hello, this is the scheduling agent in ${voiceType} voice mode. I saw you requested a technician callback. What day is best?` },
        { role: 'user', message: "Do you have any availability this coming Wednesday morning?" },
        { role: 'assistant', message: "Yes! I have a slot open next Wednesday at 9:30 AM or 11:00 AM. Would one of those work for you?" },
        { role: 'user', message: "Wednesday at 9:30 AM is perfect." },
        { role: 'assistant', message: "Done. I've scheduled your technician checkup for next Wednesday at 9:30 AM. A calendar confirmation has been sent." }
      ];
    } else {
      trans = [
        { role: 'assistant', message: `Hello, this is your AI dialer assistant. I am running in ${voiceType} mode to simulate your objection handling scenario: "${scenario}". How can I help?` },
        { role: 'user', message: "I want to see how you adapt to custom scripts and business rules." },
        { role: 'assistant', message: "I process natural language queries dynamically! I can verify customer data, handle scheduling pipelines, or log service objections instantly. What would you like to verify?" },
        { role: 'user', message: "Looks great. The simulation is operating properly." },
        { role: 'assistant', message: "Excellent! I will capture this run. Let me know if you would like to run another voice AI test scenario." }
      ];
    }

    for (const t of trans) {
      await prisma.callTranscript.create({
        data: {
          callId: testRecord.id,
          role: t.role,
          message: t.message
        }
      });
    }

    res.json({
      testId: testRecord.id,
      transcript: trans,
      audioUrl: '/mock-call-audio.mp3',
      analytics: {
        sentiment: 'Positive',
        durationSec: 48,
        interruptionCount: 0,
        objectionsHandled: 1
      }
    });
  } catch (error: any) {
    console.error('Voice test error:', error);
    res.status(500).json({ error: error.message || 'Failed to trigger voice test' });
  }
});

// --- SUPER ADMIN ENDPOINTS ---

// Database Approval Center - List all projects with details
router.get('/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: true,
        agent: true,
        uploadedFiles: true,
        leads: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ projects });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve projects list' });
  }
});

// Project approval action (Approve / Reject)
router.patch('/projects/:id/approve', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    const project = await prisma.project.findUnique({ where: { id }, include: { client: true } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { status }
    });

    // Write file state
    await prisma.uploadedFile.updateMany({
      where: { projectId: id },
      data: { status }
    });

    // Notify client users mapped to this client
    const clientUsers = await prisma.user.findMany({ where: { clientId: project.clientId } });
    for (const user of clientUsers) {
      await pushNotification(user.id, `Database ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`, `Your project "${project.name}" has been ${status.toLowerCase()} by Super Admin.`);
      await pushActivity(user.id, status === 'APPROVED' ? 'Approved by Super Admin' : 'Rejected by Super Admin', `Super admin changed project status to ${status}.`);
    }

    res.json({ project: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update approval status' });
  }
});

// Work Distribution Engine (manual split or auto equal distribution)
router.post('/projects/:id/distribute', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { agentSplits, auto } = req.body; 
    // agentSplits: Array of { agentId, count }

    const project = await prisma.project.findUnique({ where: { id }, include: { client: true, leads: true } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const totalLeads = await prisma.lead.count({ where: { projectId: id } });
    const agents = await prisma.agent.findMany({ where: { status: 'AVAILABLE' } });

    if (agents.length === 0) {
      return res.status(400).json({ error: 'No active agents available for distribution splits.' });
    }

    let distributions: Array<{ agentId: string, count: number }> = [];

    if (auto) {
      const splitCount = Math.floor(totalLeads / agents.length);
      distributions = agents.map((agent: any, index: number) => ({
        agentId: agent.id,
        count: index === agents.length - 1 ? totalLeads - splitCount * index : splitCount
      }));
    } else if (agentSplits && Array.isArray(agentSplits)) {
      distributions = agentSplits;
    } else {
      return res.status(400).json({ error: 'Please specify agent splits or select auto-distribution.' });
    }

    // Allocate Leads to Agents
    const leads = await prisma.lead.findMany({ where: { projectId: id } });
    let leadIndex = 0;

    for (const dist of distributions) {
      // Create Assignment record
      await prisma.assignment.create({
        data: {
          projectId: id,
          agentId: dist.agentId,
          recordCount: dist.count
        }
      });

      // Update Agent tasks
      await prisma.agent.update({
        where: { id: dist.agentId },
        data: {
          activeTasks: { increment: 1 }
        }
      });

      // Update Lead assigned agent ids
      const endIdx = Math.min(leadIndex + dist.count, leads.length);
      for (let i = leadIndex; i < endIdx; i++) {
        await prisma.lead.update({
          where: { id: leads[i].id },
          data: {
            userId: dist.agentId // Maps lead owner to agent scope
          }
        });
      }
      leadIndex = endIdx;
    }

    // Update Project Status
    const primaryAgentId = distributions[0]?.agentId || null;
    const updated = await prisma.project.update({
      where: { id },
      data: {
        status: 'AGENT_ASSIGNED',
        agentId: primaryAgentId
      }
    });

    // Timeline Logs & Alerts
    const primaryAgent = primaryAgentId ? await prisma.agent.findUnique({ where: { id: primaryAgentId } }) : null;
    const clientUsers = await prisma.user.findMany({ where: { clientId: project.clientId } });
    for (const user of clientUsers) {
      await pushNotification(user.id, 'Agent Assigned', `Agent ${primaryAgent?.name || 'Staff'} has been assigned to project "${project.name}".`);
      await pushActivity(user.id, 'Assigned to Agent', `Project "${project.name}" assigned to Agent ${primaryAgent?.name || 'Staff'}.`);
    }

    // Notify Assigned Agents
    for (const dist of distributions) {
      const agentUser = await prisma.user.findFirst({ where: { agentId: dist.agentId } });
      if (agentUser) {
        await pushNotification(agentUser.id, 'New Work Assigned', `You have been allocated ${dist.count} records on campaign "${project.name}".`);
      }
    }

    res.json({ project: updated, distributions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Work distribution failed' });
  }
});

// Workload metrics visualizer for Super Admin
router.get('/workload', requireAuth, async (req, res) => {
  try {
    const agents = await prisma.agent.findMany();
    const metrics = agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      capacity: agent.capacity,
      activeTasks: agent.activeTasks,
      completionRate: agent.completionRate
    }));
    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AGENT ENDPOINTS ---

// Trigger Work (Start / Pause / Complete)
router.patch('/projects/:id/agent-work', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // START, PAUSE, COMPLETE

    const project = await prisma.project.findUnique({ where: { id }, include: { client: true } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let status = project.status;
    let progress = project.progress;
    let actualCompletion: Date | null = null;
    let startDate: Date | null = project.startDate;

    if (action === 'START') {
      status = 'WORK_STARTED';
      progress = 25;
      startDate = new Date();
    } else if (action === 'PAUSE') {
      status = 'IN_PROGRESS';
      progress = 50;
    } else if (action === 'COMPLETE') {
      status = 'COMPLETED';
      progress = 100;
      actualCompletion = new Date();
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { status, progress, startDate, actualCompletion }
    });

    // Push logs
    const actionText = action === 'START' ? 'Agent started calling' : action === 'PAUSE' ? 'Work paused' : 'Project completed';
    const clientUsers = await prisma.user.findMany({ where: { clientId: project.clientId } });
    for (const user of clientUsers) {
      await pushNotification(user.id, `Project Update`, `Project "${project.name}" status updated to ${status}.`);
      await pushActivity(user.id, actionText, `Project "${project.name}" has been marked as ${action.toLowerCase()}ed.`);
    }

    res.json({ project: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update work status' });
  }
});

// List leads assigned to agent for a project
router.get('/agent-leads/:projectId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const leads = await prisma.lead.findMany({
      where: {
        projectId
      }
    });
    res.json({ leads });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Lead Status (NEW, CONTACTED, NO_ANSWER, INTERESTED, FOLLOW_UP, CLOSED)
router.patch('/leads/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id }, include: { project: true } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const updated = await prisma.lead.update({
      where: { id },
      data: { status }
    });

    // Re-evaluate project progress based on completed leads (e.g. CLOSED)
    const totalLeads = await prisma.lead.count({ where: { projectId: lead.projectId } });
    const completedLeads = await prisma.lead.count({ where: { projectId: lead.projectId, status: 'CLOSED' } });
    const progressPercent = totalLeads > 0 ? Math.min(Math.round((completedLeads / totalLeads) * 100), 100) : 0;

    await prisma.project.update({
      where: { id: lead.projectId },
      data: { progress: progressPercent }
    });

    // Push WebSocket Sync Event
    broadcastEvent({ type: 'LEAD_STATUS_UPDATE', leadId: id, status, projectId: lead.projectId, progress: progressPercent });

    res.json({ lead: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
