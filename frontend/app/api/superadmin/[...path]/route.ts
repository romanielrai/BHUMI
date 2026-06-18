import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole, json } from '@/lib/auth';
import { getConfigs, updateConfigs } from '@/lib/config-store';

async function checkSuperAdmin(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return { error: auth.error };
  const forbidden = requireRole(auth.user, 'SUPERADMIN');
  if (forbidden) return { error: forbidden };
  return { user: auth.user };
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const check = await checkSuperAdmin(req);
  if ('error' in check) return check.error;
  const { user } = check;

  const path = params.path.join('/');

  // --- users ---
  if (path === 'users') {
    const users = await prisma.user.findMany({ include: { role: true } });
    return json({ users });
  }

  // --- audit-logs ---
  if (path === 'audit-logs') {
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
    return json({ logs });
  }

  // --- conversation-logs ---
  if (path === 'conversation-logs') {
    const logs = await prisma.chatbotLog.findMany({ orderBy: { createdAt: 'desc' } });
    return json({ logs });
  }

  // --- configs ---
  if (path === 'configs') {
    return json({ configs: getConfigs() });
  }

  // --- system-health ---
  if (path === 'system-health') {
    return json({
      uptime: Math.floor(process.uptime?.() ?? 0),
      memory: { rss: 128, heapTotal: 64, heapUsed: 48 },
      metrics: {
        apiLatencyMs: Math.floor(Math.random() * 25) + 5,
        dbLatencyMs: Math.floor(Math.random() * 5) + 1,
        activeConnections: Math.floor(Math.random() * 6) + 2,
        queueSize: 0,
      },
      integrations: {
        databaseType: 'In-Memory (Serverless)',
        databaseConnection: 'CONNECTED',
        openai: process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('mock') ? 'LIVE' : 'SIMULATED',
        twilio: process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') ? 'LIVE' : 'SIMULATED',
      },
    });
  }

  // --- employees ---
  if (path === 'employees') {
    const roles = await prisma.role.findMany();
    const roleMap = new Map(roles.map((r: any) => [r.id, r]));
    const users = await prisma.user.findMany({ include: { role: true } });
    const filteredUsers = users.filter((u: any) => {
      const r = roleMap.get(u.roleId) as any;
      return r && r.name !== 'SUPERADMIN';
    });

    const employees = await Promise.all(
      filteredUsers.map(async (u: any) => {
        const designation = u.designationId
          ? await prisma.designation.findUnique({ where: { id: u.designationId } })
          : null;
        const prospectCount = await prisma.lead.count({ where: { userId: u.id } });
        const todayStr = new Date().toISOString().split('T')[0];
        const planner = await prisma.dailyPlanner.findFirst({ where: { userId: u.id, date: todayStr } });
        const recentUpdates = await prisma.dailyUpdate.findMany({
          where: { userId: u.id },
          orderBy: { createdAt: 'desc' },
          take: 3,
        });
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          phone: u.phone || '',
          suspended: u.suspended || false,
          joiningDate: u.joiningDate,
          status: u.status || 'ACTIVE',
          role: u.role,
          designation,
          prospectCount,
          dailyPlanner: planner || { callTarget: 0, callsMade: 0 },
          recentUpdates,
        };
      })
    );
    return json({ employees });
  }

  // --- designations ---
  if (path === 'designations') {
    const designations = await prisma.designation.findMany();
    return json({ designations });
  }

  // --- prospects/summary ---
  if (path === 'prospects/summary') {
    const projects = await prisma.project.findMany({
      include: { agent: true, leads: true },
      orderBy: { createdAt: 'desc' },
    });
    const summary = await Promise.all(
      projects.map(async (p: any) => {
        const total = p.leads?.length ?? 0;
        const assigned = (p.leads ?? []).filter((l: any) => l.userId).length;
        const completed = (p.leads ?? []).filter((l: any) => l.status === 'CLOSED').length;
        const agentUser = p.agentId
          ? await prisma.user.findFirst({ where: { agentId: p.agentId } })
          : null;
        const firstLead = p.leads?.[0];
        const assignedUser =
          agentUser ||
          (firstLead?.userId ? await prisma.user.findUnique({ where: { id: firstLead.userId } }) : null);
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          progress: p.progress,
          createdAt: p.createdAt,
          totalLeads: total,
          assignedLeads: assigned,
          completedLeads: completed,
          assignedTo: assignedUser
            ? { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email }
            : null,
        };
      })
    );
    return json({ summary });
  }

  // --- prospects/leads (all leads for the Prospects Control tab) ---
  if (path === 'prospects/leads') {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Enrich with assignee
    const enriched = await Promise.all(
      leads.map(async (l: any) => {
        const assignee = l.userId ? await prisma.user.findUnique({ where: { id: l.userId } }) : null;
        return { ...l, assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null };
      })
    );
    return json({ leads: enriched });
  }

  return json({ error: 'Not found' }, 404);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const check = await checkSuperAdmin(req);
  if ('error' in check) return check.error;
  const { user } = check;

  const path = params.path.join('/');
  const body = await req.json().catch(() => ({}));

  // --- users ---
  if (path === 'users') {
    const { email, password, name, roleName } = body;
    if (!email || !password || !roleName) return json({ error: 'Email, password, and roleName are required' }, 400);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return json({ error: 'A user with this email already exists' }, 400);

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return json({ error: `Invalid role name: ${roleName}` }, 400);

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: { email, name: name || email.split('@')[0], passwordHash, roleId: role.id },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: { action: 'CREATE_USER', actor: user.email, details: `Created user '${email}' with role '${roleName}'`, ipAddress: '127.0.0.1' },
    });

    return json({ user: newUser });
  }

  // --- configs ---
  if (path === 'configs') {
    const configs = updateConfigs(body);
    await prisma.auditLog.create({
      data: { action: 'UPDATE_CONFIG', actor: user.email, details: 'System configurations updated', ipAddress: '127.0.0.1' },
    });
    return json({ message: 'Configurations updated successfully', configs });
  }

  // --- employees ---
  if (path === 'employees') {
    const { name, email, phone, password, designationId, roleName } = body;
    if (!email || !password || !roleName) return json({ error: 'Email, password, and roleName are required' }, 400);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return json({ error: 'A user with this email already exists' }, 400);

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return json({ error: `Invalid role name: ${roleName}` }, 400);

    const passwordHash = await bcrypt.hash(password, 12);
    let agentId = undefined;
    if (roleName === 'AGENT') {
      const agent = await prisma.agent.create({
        data: { name: name || email.split('@')[0], email, phone: phone || '', capacity: 1000, status: 'AVAILABLE' },
      });
      agentId = agent.id;
    }

    const employee = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        roleId: role.id,
        phone: phone || '',
        designationId: designationId || '',
        agentId,
        status: 'ACTIVE',
        suspended: false,
        joiningDate: new Date().toISOString(),
      },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: { action: 'CREATE_EMPLOYEE', actor: user.email, details: `Created employee '${email}' with role '${roleName}'`, ipAddress: '127.0.0.1' },
    });

    return json({ employee });
  }

  // --- designations ---
  if (path === 'designations') {
    const { name, description, permissions } = body;
    if (!name) return json({ error: 'Name is required' }, 400);

    const designation = await prisma.designation.create({
      data: { name, description: description || '', permissions: permissions || 'VIEW_OWN,CALL_LEADS' },
    });

    await prisma.auditLog.create({
      data: { action: 'CREATE_DESIGNATION', actor: user.email, details: `Created designation '${name}'`, ipAddress: '127.0.0.1' },
    });

    return json({ designation });
  }

  // --- prospects/upload-preview ---
  if (path === 'prospects/upload-preview') {
    const { csvContent } = body;
    if (!csvContent) return json({ error: 'csvContent is required' }, 400);

    const lines = csvContent.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
    if (lines.length === 0) return json({ error: 'CSV content is empty' }, 400);

    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length < headers.length) continue;
      const row: any = {};
      headers.forEach((header: string, index: number) => { row[header] = values[index]; });
      rows.push({
        name: row.name || row.fullname || 'Unknown Prospect',
        company: row.company || row.business || 'Unknown Company',
        phone: row.phone || row.telephone || '',
        email: row.email || '',
        notes: row.notes || row.remarks || '',
      });
    }
    return json({ preview: rows });
  }

  // --- prospects/upload-confirm ---
  if (path === 'prospects/upload-confirm') {
    const { listName, prospects } = body;
    if (!listName || !Array.isArray(prospects)) return json({ error: 'listName and prospects array are required' }, 400);

    const project = await prisma.project.create({
      data: { name: listName, clientId: 'client-default', status: 'PENDING_APPROVAL', progress: 0 },
    });

    await prisma.uploadedFile.create({
      data: { fileName: listName + '.csv', fileType: 'CSV', recordCount: prospects.length, status: 'PENDING_APPROVAL', clientId: 'client-default', projectId: project.id },
    });

    for (const p of prospects) {
      await prisma.lead.create({
        data: {
          name: p.name || 'Unknown Prospect',
          company: p.company || 'Unknown Company',
          phone: p.phone || '',
          email: p.email || '',
          notes: p.notes || '',
          status: 'NEW',
          projectId: project.id,
          clientId: 'client-default',
        },
      });
    }

    await prisma.auditLog.create({
      data: { action: 'UPLOAD_PROSPECTS', actor: user.email, details: `Bulk uploaded "${listName}" (${prospects.length} records)`, ipAddress: '127.0.0.1' },
    });

    return json({ success: true, projectId: project.id, recordCount: prospects.length });
  }

  // --- prospects/assign ---
  if (path === 'prospects/assign') {
    const { projectId, leadIds, employeeId } = body;
    if (!employeeId) return json({ error: 'employeeId is required' }, 400);

    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) return json({ error: 'Employee not found' }, 404);

    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return json({ error: 'Project not found' }, 404);

      await prisma.project.update({
        where: { id: projectId },
        data: { agentId: employee.agentId || null, status: 'AGENT_ASSIGNED' },
      });
      await prisma.lead.updateMany({ where: { projectId }, data: { userId: employeeId } });

      await prisma.auditLog.create({
        data: { action: 'ASSIGN_PROSPECTS', actor: user.email, details: `Assigned list "${project.name}" to "${employee.name}"`, ipAddress: '127.0.0.1' },
      });
    } else if (leadIds && Array.isArray(leadIds)) {
      await prisma.lead.updateMany({ where: { id: { in: leadIds } }, data: { userId: employeeId } });
      await prisma.auditLog.create({
        data: { action: 'ASSIGN_PROSPECTS', actor: user.email, details: `Assigned ${leadIds.length} prospects to "${employee.name}"`, ipAddress: '127.0.0.1' },
      });
    } else {
      return json({ error: 'Either projectId or leadIds must be provided' }, 400);
    }

    await prisma.notification.create({
      data: {
        userId: employeeId,
        title: 'New Prospects Allocated',
        message: projectId ? 'You have been assigned a new prospect campaign list.' : `You have been allocated ${leadIds?.length} new prospects.`,
        channel: 'IN_APP',
        read: false,
      },
    });

    return json({ success: true });
  }

  // --- prospects/unassign ---
  if (path === 'prospects/unassign') {
    const { leadIds } = body;
    if (!Array.isArray(leadIds)) return json({ error: 'leadIds array is required' }, 400);
    await prisma.lead.updateMany({ where: { id: { in: leadIds } }, data: { userId: null } });
    return json({ success: true });
  }

  return json({ error: 'Not found' }, 404);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  const check = await checkSuperAdmin(req);
  if ('error' in check) return check.error;
  const { user } = check;

  const pathParts = params.path;
  const body = await req.json().catch(() => ({}));

  // PATCH /superadmin/users/:id
  if (pathParts[0] === 'users' && pathParts[1]) {
    const id = pathParts[1];
    const { name, email, roleName, suspended } = body;

    const dbUser = await prisma.user.findUnique({ where: { id } });
    if (!dbUser) return json({ error: 'User not found' }, 404);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (suspended !== undefined) updateData.suspended = suspended;
    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) return json({ error: `Invalid role name: ${roleName}` }, 400);
      updateData.roleId = role.id;
    }

    const updated = await prisma.user.update({ where: { id }, data: updateData, include: { role: true } });
    await prisma.auditLog.create({
      data: { action: 'UPDATE_USER', actor: user.email, details: `Updated user '${dbUser.email}'`, ipAddress: '127.0.0.1' },
    });
    return json({ user: updated });
  }

  // PATCH /superadmin/employees/:id
  if (pathParts[0] === 'employees' && pathParts[1]) {
    const id = pathParts[1];
    const { name, email, phone, designationId, roleName, suspended, status } = body;

    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee) return json({ error: 'Employee not found' }, 404);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (designationId !== undefined) updateData.designationId = designationId;
    if (suspended !== undefined) updateData.suspended = suspended;
    if (status !== undefined) updateData.status = status;
    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) return json({ error: `Invalid role: ${roleName}` }, 400);
      updateData.roleId = role.id;
    }

    const updated = await prisma.user.update({ where: { id }, data: updateData, include: { role: true } });

    if (employee.agentId) {
      const agentUpdate: any = {};
      if (name !== undefined) agentUpdate.name = name;
      if (email !== undefined) agentUpdate.email = email;
      if (phone !== undefined) agentUpdate.phone = phone;
      if (suspended !== undefined) agentUpdate.status = suspended ? 'UNAVAILABLE' : 'AVAILABLE';
      await prisma.agent.update({ where: { id: employee.agentId }, data: agentUpdate });
    }

    await prisma.auditLog.create({
      data: { action: 'UPDATE_EMPLOYEE', actor: user.email, details: `Updated employee '${employee.email}'`, ipAddress: '127.0.0.1' },
    });

    return json({ employee: updated });
  }

  // PATCH /superadmin/designations/:id
  if (pathParts[0] === 'designations' && pathParts[1]) {
    const id = pathParts[1];
    const { name, description, permissions } = body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (permissions !== undefined) data.permissions = permissions;
    const designation = await prisma.designation.update({ where: { id }, data });
    return json({ designation });
  }

  return json({ error: 'Not found' }, 404);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  const check = await checkSuperAdmin(req);
  if ('error' in check) return check.error;
  const { user } = check;

  const pathParts = params.path;

  // DELETE /superadmin/users/:id
  if (pathParts[0] === 'users' && pathParts[1]) {
    const id = pathParts[1];
    const dbUser = await prisma.user.findUnique({ where: { id } });
    if (!dbUser) return json({ error: 'User not found' }, 404);
    await prisma.user.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { action: 'DELETE_USER', actor: user.email, details: `Deleted user '${dbUser.email}'`, ipAddress: '127.0.0.1' },
    });
    return json({ message: 'User deleted successfully' });
  }

  // DELETE /superadmin/employees/:id
  if (pathParts[0] === 'employees' && pathParts[1]) {
    const id = pathParts[1];
    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee) return json({ error: 'Employee not found' }, 404);
    await prisma.user.delete({ where: { id } });
    if (employee.agentId) await prisma.agent.delete({ where: { id: employee.agentId } });
    await prisma.auditLog.create({
      data: { action: 'DELETE_EMPLOYEE', actor: user.email, details: `Deleted employee '${employee.email}'`, ipAddress: '127.0.0.1' },
    });
    return json({ message: 'Employee deleted successfully' });
  }

  // DELETE /superadmin/designations/:id
  if (pathParts[0] === 'designations' && pathParts[1]) {
    const id = pathParts[1];
    await prisma.designation.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { action: 'DELETE_DESIGNATION', actor: user.email, details: `Deleted designation '${id}'`, ipAddress: '127.0.0.1' },
    });
    return json({ message: 'Designation deleted successfully' });
  }

  return json({ error: 'Not found' }, 404);
}
