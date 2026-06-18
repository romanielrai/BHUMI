import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, json } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');

  // GET /api/crm/stream
  if (path === 'stream') {
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();
    writer.write(encoder.encode('data: {"type": "connected"}\n\n'));
    // Return stream response keeping it alive briefly
    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // GET /api/crm/notifications
  if (path === 'notifications') {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return json({ notifications });
  }

  // GET /api/crm/projects
  if (path === 'projects') {
    const projects = await prisma.project.findMany({
      include: {
        client: true,
        admin: true,
        uploadedFiles: true,
        leads: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return json({ projects });
  }

  // GET /api/crm/workload
  if (path === 'workload') {
    const admins = await prisma.admin.findMany();
    const metrics = admins.map((admin: any) => ({
      id: admin.id,
      name: admin.name,
      capacity: admin.capacity,
      activeTasks: admin.activeTasks,
      completionRate: admin.completionRate,
    }));
    return json({ metrics });
  }

  // GET /api/crm/admin-leads/[projectId]
  if (path.startsWith('admin-leads/')) {
    const projectId = resolvedParams.path[1];
    const isAdmin = user.role === 'ADMIN' || user.role === 'EMPLOYEE' || user.role === 'TEAMLEADER';
    const filter: any = { projectId };
    if (isAdmin) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      filter.userId = { in: [user.id, dbUser?.adminId || ''] };
    }
    const leads = await prisma.lead.findMany({ where: filter });
    return json({ leads });
  }

  // GET /api/crm/admin/daily-planner
  if (path === 'admin/daily-planner') {
    const todayStr = new Date().toISOString().split('T')[0];
    let planner = await prisma.dailyPlanner.findFirst({
      where: { userId: user.id, date: todayStr },
    });
    if (!planner) {
      planner = await prisma.dailyPlanner.create({
        data: {
          userId: user.id,
          date: todayStr,
          callTarget: 20,
          callsMade: 0,
        },
      });
    }
    const meetings = await prisma.employeeMeeting.findMany({
      where: { userId: user.id, date: todayStr },
    });
    const tasks = await prisma.employeeTask.findMany({
      where: { userId: user.id, date: todayStr },
    });
    return json({ planner, meetings, tasks });
  }

  // GET /api/crm/admin/daily-updates
  if (path === 'admin/daily-updates') {
    const updates = await prisma.dailyUpdate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return json({ updates });
  }

  return json({ error: 'Not found' }, 404);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const body = await req.json().catch(() => ({}));

  // POST /api/crm/upload
  if (path === 'upload') {
    const { fileName, fileType, recordCount } = body;
    if (!fileName || !recordCount) {
      return json({ error: 'fileName and recordCount are required' }, 400);
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const clientId = dbUser?.clientId || 'client-default';

    const project = await prisma.project.create({
      data: {
        name: fileName.replace(/\.[^/.]+$/, "") + " Campaign",
        clientId,
        status: 'PENDING_APPROVAL',
        progress: 0,
      },
    });

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName,
        fileType: fileType || 'CSV',
        recordCount: Number(recordCount),
        status: 'PENDING_APPROVAL',
        clientId,
        projectId: project.id,
      },
    });

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
          clientId,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'Database uploaded',
        details: `Database ${fileName} (${recordCount} records) uploaded successfully.`,
      },
    });

    const superadmin = await prisma.user.findFirst({ where: { role: { name: 'SUPERADMIN' } } });
    if (superadmin) {
      await prisma.notification.create({
        data: {
          userId: superadmin.id,
          title: 'New Database Uploaded',
          message: `Client has uploaded a new database "${fileName}" (${recordCount} records) pending approval.`,
          channel: 'IN_APP',
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Database Uploaded',
        message: `Your file "${fileName}" has been queued for Super Admin approval.`,
        channel: 'IN_APP',
      },
    });

    return json({ project, uploadedFile });
  }

  // POST /api/crm/voice-test
  if (path === 'voice-test') {
    const { phone, scenario, voiceType } = body;
    if (!phone || !scenario) {
      return json({ error: 'Phone number and scenario description are required' }, 400);
    }

    const testRecord = await prisma.voiceTest.create({
      data: {
        phone,
        scenario,
        voiceType: voiceType || 'Female Professional',
      },
    });

    const scenarioClean = scenario.toLowerCase();
    let trans = [];
    if (scenarioClean.includes('price') || scenarioClean.includes('cost') || scenarioClean.includes('expensive')) {
      trans = [
        { role: 'assistant', message: `Hello, this is the AI assistant in ${voiceType} voice mode. I saw you requested details on our pricing packages. How can I help you?` },
        { role: 'user', message: "Yes, I wanted to check the pricing. It seems a bit higher than other quotes I've got." },
        { role: 'assistant', message: `I completely understand that cost is key. However, our services include an all-inclusive warranty, immediate 24/7 callouts, and local technician dispatch with zero extra fees. Does that level of protection cover your requirements?` },
        { role: 'user', message: "Yes, actually. Having guaranteed fast dispatch saves us a lot of downtime. Let's do it." },
        { role: 'assistant', message: "Excellent! I have locked in your account activation. A quote breakdown is on its way to your cell." },
      ];
    } else if (scenarioClean.includes('schedule') || scenarioClean.includes('time') || scenarioClean.includes('appointment')) {
      trans = [
        { role: 'assistant', message: `Hello, this is the scheduling agent in ${voiceType} voice mode. I saw you requested a technician callback. What day is best?` },
        { role: 'user', message: "Do you have any availability this coming Wednesday morning?" },
        { role: 'assistant', message: "Yes! I have a slot open next Wednesday at 9:30 AM or 11:00 AM. Would one of those work for you?" },
        { role: 'user', message: "Wednesday at 9:30 AM is perfect." },
        { role: 'assistant', message: "Done. I've scheduled your technician checkup for next Wednesday at 9:30 AM. A calendar confirmation has been sent." },
      ];
    } else {
      trans = [
        { role: 'assistant', message: `Hello, this is your AI dialer assistant. I am running in ${voiceType} mode to simulate your objection handling scenario: "${scenario}". How can I help?` },
        { role: 'user', message: "I want to see how you adapt to custom scripts and business rules." },
        { role: 'assistant', message: "I process natural language queries dynamically! I can verify customer data, handle scheduling pipelines, or log service objections instantly. What would you like to verify?" },
        { role: 'user', message: "Looks great. The simulation is operating properly." },
        { role: 'assistant', message: "Excellent! I will capture this run. Let me know if you would like to run another voice AI test scenario." },
      ];
    }

    for (const t of trans) {
      await prisma.callTranscript.create({
        data: {
          callId: testRecord.id,
          role: t.role,
          message: t.message,
        },
      });
    }

    return json({
      testId: testRecord.id,
      transcript: trans,
      audioUrl: '/mock-call-audio.mp3',
      analytics: {
        sentiment: 'Positive',
        durationSec: 48,
        interruptionCount: 0,
        objectionsHandled: 1,
      },
    });
  }

  // POST /api/crm/projects/[id]/distribute
  if (resolvedParams.path[0] === 'projects' && resolvedParams.path[2] === 'distribute') {
    const id = resolvedParams.path[1];
    const { adminSplits, auto } = body;

    const project = await prisma.project.findUnique({ where: { id }, include: { client: true } });
    if (!project) return json({ error: 'Project not found' }, 404);

    const totalLeads = await prisma.lead.count({ where: { projectId: id } });
    const admins = await prisma.admin.findMany({ where: { status: 'AVAILABLE' } });
    if (admins.length === 0) {
      return json({ error: 'No active admins available for distribution splits.' }, 400);
    }

    let distributions: Array<{ adminId: string; count: number }> = [];
    if (auto) {
      const splitCount = Math.floor(totalLeads / admins.length);
      distributions = admins.map((admin: any, index: number) => ({
        adminId: admin.id,
        count: index === admins.length - 1 ? totalLeads - splitCount * index : splitCount,
      }));
    } else if (adminSplits && Array.isArray(adminSplits)) {
      distributions = adminSplits;
    } else {
      return json({ error: 'Please specify admin splits or select auto-distribution.' }, 400);
    }

    const leads = await prisma.lead.findMany({ where: { projectId: id } });
    let leadIndex = 0;

    for (const dist of distributions) {
      await prisma.assignment.create({
        data: {
          projectId: id,
          adminId: dist.adminId,
          recordCount: dist.count,
        },
      });

      await prisma.admin.update({
        where: { id: dist.adminId },
        data: { activeTasks: { increment: 1 } },
      });

      const endIdx = Math.min(leadIndex + dist.count, leads.length);
      for (let i = leadIndex; i < endIdx; i++) {
        // Find corresponding user representing this admin to assign leads userId
        const adminUser = await prisma.user.findFirst({ where: { adminId: dist.adminId } });
        await prisma.lead.update({
          where: { id: leads[i].id },
          data: { userId: adminUser?.id || null },
        });
      }
      leadIndex = endIdx;
    }

    const primaryAdminId = distributions[0]?.adminId || null;
    const updated = await prisma.project.update({
      where: { id },
      data: { status: 'ADMIN_ASSIGNED', adminId: primaryAdminId },
    });

    const primaryAdmin = primaryAdminId ? await prisma.admin.findUnique({ where: { id: primaryAdminId } }) : null;
    const clientUsers = await prisma.user.findMany({ where: { clientId: project.clientId } });
    for (const u of clientUsers) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          title: 'Admin Assigned',
          message: `Admin ${primaryAdmin?.name || 'Staff'} has been assigned to project "${project.name}".`,
        },
      });
      await prisma.activityLog.create({
        data: {
          userId: u.id,
          action: 'Assigned to Admin',
          details: `Project "${project.name}" assigned to Admin ${primaryAdmin?.name || 'Staff'}.`,
        },
      });
    }

    for (const dist of distributions) {
      const adminUser = await prisma.user.findFirst({ where: { adminId: dist.adminId } });
      if (adminUser) {
        await prisma.notification.create({
          data: {
            userId: adminUser.id,
            title: 'New Work Assigned',
            message: `You have been allocated ${dist.count} records on campaign "${project.name}".`,
          },
        });
      }
    }

    return json({ project: updated, distributions });
  }

  // POST /api/crm/admin/daily-planner/target
  if (path === 'admin/daily-planner/target') {
    const { target } = body;
    if (target === undefined) return json({ error: 'Target value is required' }, 400);

    const todayStr = new Date().toISOString().split('T')[0];
    let planner = await prisma.dailyPlanner.findFirst({
      where: { userId: user.id, date: todayStr },
    });

    if (planner) {
      planner = await prisma.dailyPlanner.update({
        where: { id: planner.id },
        data: { callTarget: Number(target) },
      });
    } else {
      planner = await prisma.dailyPlanner.create({
        data: {
          userId: user.id,
          date: todayStr,
          callTarget: Number(target),
          callsMade: 0,
        },
      });
    }
    return json({ planner });
  }

  // POST /api/crm/admin/daily-planner/meeting
  if (path === 'admin/daily-planner/meeting') {
    const { time, prospectName, purpose } = body;
    if (!time || !prospectName) return json({ error: 'Time and prospectName are required' }, 400);

    const todayStr = new Date().toISOString().split('T')[0];
    const meeting = await prisma.employeeMeeting.create({
      data: {
        userId: user.id,
        date: todayStr,
        time,
        prospectName,
        purpose: purpose || '',
        completed: false,
      },
    });
    return json({ meeting });
  }

  // POST /api/crm/admin/daily-planner/task
  if (path === 'admin/daily-planner/task') {
    const { title } = body;
    if (!title) return json({ error: 'Title is required' }, 400);

    const todayStr = new Date().toISOString().split('T')[0];
    const task = await prisma.employeeTask.create({
      data: {
        userId: user.id,
        date: todayStr,
        title,
        completed: false,
      },
    });
    return json({ task });
  }

  // POST /api/crm/admin/daily-update
  if (path === 'admin/daily-update') {
    const { summary } = body;
    if (!summary) return json({ error: 'Summary is required' }, 400);

    const todayStr = new Date().toISOString().split('T')[0];
    const dailyUpdate = await prisma.dailyUpdate.create({
      data: {
        userId: user.id,
        date: todayStr,
        summary,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'Daily update logged',
        details: `Logged work update: "${summary.substring(0, 60)}..."`,
      },
    });

    return json({ dailyUpdate });
  }

  return json({ error: 'Not found' }, 404);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const resolvedParams = await params;
  const pathParts = resolvedParams.path;
  const body = await req.json().catch(() => ({}));

  // PATCH /api/crm/notifications/:id/read
  if (pathParts[0] === 'notifications' && pathParts[2] === 'read') {
    const id = pathParts[1];
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    return json({ notification });
  }

  // PATCH /api/crm/projects/:id/approve
  if (pathParts[0] === 'projects' && pathParts[2] === 'approve') {
    const id = pathParts[1];
    const { status } = body;

    const project = await prisma.project.findUnique({ where: { id }, include: { client: true } });
    if (!project) return json({ error: 'Project not found' }, 404);

    const updated = await prisma.project.update({
      where: { id },
      data: { status },
    });

    await prisma.uploadedFile.updateMany({
      where: { projectId: id },
      data: { status },
    });

    const clientUsers = await prisma.user.findMany({ where: { clientId: project.clientId } });
    for (const u of clientUsers) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          title: `Database ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          message: `Your project "${project.name}" has been ${status.toLowerCase()} by Super Admin.`,
        },
      });
      await prisma.activityLog.create({
        data: {
          userId: u.id,
          action: status === 'APPROVED' ? 'Approved by Super Admin' : 'Rejected by Super Admin',
          details: `Super admin changed project status to ${status}.`,
        },
      });
    }

    return json({ project: updated });
  }

  // PATCH /api/crm/projects/:id/admin-work
  if (pathParts[0] === 'projects' && pathParts[2] === 'admin-work') {
    const id = pathParts[1];
    const { action } = body;

    const project = await prisma.project.findUnique({ where: { id }, include: { client: true } });
    if (!project) return json({ error: 'Project not found' }, 404);

    let status = project.status;
    let progress = project.progress;
    let actualCompletion = project.actualCompletion;
    let startDate = project.startDate;

    if (action === 'START') {
      status = 'WORK_STARTED';
      progress = 25;
      startDate = new Date().toISOString();
    } else if (action === 'PAUSE') {
      status = 'IN_PROGRESS';
      progress = 50;
    } else if (action === 'COMPLETE') {
      status = 'COMPLETED';
      progress = 100;
      actualCompletion = new Date().toISOString();
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { status, progress, startDate, actualCompletion },
    });

    const actionText = action === 'START' ? 'Admin started calling' : action === 'PAUSE' ? 'Work paused' : 'Project completed';
    const clientUsers = await prisma.user.findMany({ where: { clientId: project.clientId } });
    for (const u of clientUsers) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          title: `Project Update`,
          message: `Project "${project.name}" status updated to ${status}.`,
        },
      });
      await prisma.activityLog.create({
        data: {
          userId: u.id,
          action: actionText,
          details: `Project "${project.name}" has been marked as ${action.toLowerCase()}ed.`,
        },
      });
    }

    return json({ project: updated });
  }

  // PATCH /api/crm/leads/:id/status
  if (pathParts[0] === 'leads' && pathParts[2] === 'status') {
    const id = pathParts[1];
    const { status, phone, email, notes } = body;

    const lead = await prisma.lead.findUnique({ where: { id }, include: { project: true } });
    if (!lead) return json({ error: 'Lead not found' }, 404);

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    if (status && status !== 'NEW') {
      const todayStr = new Date().toISOString().split('T')[0];
      const planner = await prisma.dailyPlanner.findFirst({
        where: { userId: user.id, date: todayStr },
      });

      if (planner) {
        await prisma.dailyPlanner.update({
          where: { id: planner.id },
          data: { callsMade: (planner.callsMade || 0) + 1 },
        });
      } else {
        await prisma.dailyPlanner.create({
          data: {
            userId: user.id,
            date: todayStr,
            callTarget: 20,
            callsMade: 1,
          },
        });
      }
    }

    const totalLeads = await prisma.lead.count({ where: { projectId: lead.projectId } });
    const completedLeads = await prisma.lead.count({
      where: {
        projectId: lead.projectId,
        status: { in: ['CLOSED', 'DEAL_CLOSED', 'Deal Closed ✅', 'Call Went Well', 'Follow-up Meeting Scheduled'] },
      },
    });
    const progressPercent = totalLeads > 0 ? Math.min(Math.round((completedLeads / totalLeads) * 100), 100) : 0;

    await prisma.project.update({
      where: { id: lead.projectId },
      data: { progress: progressPercent },
    });

    return json({ lead: updated });
  }

  // PATCH /api/crm/admin/daily-planner/meeting/:id
  if (pathParts[0] === 'admin' && pathParts[1] === 'daily-planner' && pathParts[2] === 'meeting' && pathParts[3]) {
    const id = pathParts[3];
    const { completed, time, prospectName, purpose } = body;

    const data: any = {};
    if (completed !== undefined) data.completed = completed;
    if (time !== undefined) data.time = time;
    if (prospectName !== undefined) data.prospectName = prospectName;
    if (purpose !== undefined) data.purpose = purpose;

    const meeting = await prisma.employeeMeeting.update({
      where: { id },
      data,
    });
    return json({ meeting });
  }

  // PATCH /api/crm/admin/daily-planner/task/:id
  if (pathParts[0] === 'admin' && pathParts[1] === 'daily-planner' && pathParts[2] === 'task' && pathParts[3]) {
    const id = pathParts[3];
    const { completed, title } = body;

    const data: any = {};
    if (completed !== undefined) data.completed = completed;
    if (title !== undefined) data.title = title;

    const task = await prisma.employeeTask.update({
      where: { id },
      data,
    });
    return json({ task });
  }

  return json({ error: 'Not found' }, 404);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const resolvedParams = await params;
  const pathParts = resolvedParams.path;

  // DELETE /api/crm/admin/daily-planner/meeting/:id
  if (pathParts[0] === 'admin' && pathParts[1] === 'daily-planner' && pathParts[2] === 'meeting' && pathParts[3]) {
    const id = pathParts[3];
    await prisma.employeeMeeting.delete({ where: { id } });
    return json({ success: true });
  }

  // DELETE /api/crm/admin/daily-planner/task/:id
  if (pathParts[0] === 'admin' && pathParts[1] === 'daily-planner' && pathParts[2] === 'task' && pathParts[3]) {
    const id = pathParts[3];
    await prisma.employeeTask.delete({ where: { id } });
    return json({ success: true });
  }

  return json({ error: 'Not found' }, 404);
}
