import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Starting MySQL seed script...');

  // 1. Create Roles
  const superadminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: { id: 'role-superadmin', name: 'SUPERADMIN', description: 'Full platform super administrator access' }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { id: 'role-admin', name: 'ADMIN', description: 'Administrator access to manage clients and analytics' }
  });

  const clientRole = await prisma.role.upsert({
    where: { name: 'CLIENT' },
    update: {},
    create: { id: 'role-client', name: 'CLIENT', description: 'Client access to dashboard and reports' }
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { id: 'role-user', name: 'USER', description: 'Regular end user access' }
  });

  const agentRole = await prisma.role.upsert({
    where: { name: 'AGENT' },
    update: {},
    create: { id: 'role-agent', name: 'AGENT', description: 'Outbound Dialing Agent' }
  });

  console.log('Roles seeded.');

  // 2. Create Clients
  const defaultClient = await prisma.client.upsert({
    where: { id: 'client-default' },
    update: {},
    create: {
      id: 'client-default',
      companyName: 'Default Client Corp',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      contactPhone: '1234567890',
      status: 'ACTIVE'
    }
  });

  const personalClient = await prisma.client.upsert({
    where: { id: 'client-7k9o1' },
    update: {},
    create: {
      id: 'client-7k9o1',
      companyName: 'Personal Workspace',
      contactName: 'Romaniel Rai',
      contactEmail: 'romanielrai94@gmail.com',
      contactPhone: '9845382623',
      status: 'ACTIVE'
    }
  });

  console.log('Clients seeded.');

  // 3. Create Agents
  const agent1 = await prisma.agent.upsert({
    where: { email: 'agent@gmail.com' },
    update: {},
    create: {
      id: 'agent-1',
      name: 'John Connor',
      email: 'agent@gmail.com',
      phone: '555-0122',
      capacity: 1000,
      activeTasks: 2,
      completionRate: 92.4,
      status: 'AVAILABLE'
    }
  });

  const agent2 = await prisma.agent.upsert({
    where: { email: 'sarah@resistance.net' },
    update: {},
    create: {
      id: 'agent-2',
      name: 'Sarah Connor',
      email: 'sarah@resistance.net',
      phone: '555-0199',
      capacity: 1000,
      activeTasks: 0,
      completionRate: 95.0,
      status: 'AVAILABLE'
    }
  });

  console.log('Agents seeded.');

  // 4. Create Users
  const passwordHash = await bcrypt.hash('AdminPass123!', 12);

  // Superadmin
  const superadminUser = await prisma.user.upsert({
    where: { email: 'superadmin@gmail.com' },
    update: { passwordHash, roleId: superadminRole.id },
    create: {
      id: 'user-superadmin',
      email: 'superadmin@gmail.com',
      name: 'Super Administrator',
      passwordHash,
      roleId: superadminRole.id
    }
  });

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { passwordHash, roleId: adminRole.id, clientId: defaultClient.id },
    create: {
      id: 'user-admin',
      email: 'admin@gmail.com',
      name: 'Administrator',
      passwordHash,
      roleId: adminRole.id,
      clientId: defaultClient.id
    }
  });

  // Client User
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@gmail.com' },
    update: { passwordHash, roleId: clientRole.id, clientId: defaultClient.id },
    create: {
      id: 'user-client',
      email: 'client@gmail.com',
      name: 'Client User',
      passwordHash,
      roleId: clientRole.id,
      clientId: defaultClient.id
    }
  });

  // Normal User
  const normalUser = await prisma.user.upsert({
    where: { email: 'user@gmail.com' },
    update: { passwordHash, roleId: userRole.id, clientId: defaultClient.id },
    create: {
      id: 'user-normal',
      email: 'user@gmail.com',
      name: 'Regular User',
      passwordHash,
      roleId: userRole.id,
      clientId: defaultClient.id
    }
  });

  // Personal user (retains original password hash)
  const personalPasswordHash = '$2a$12$R7TAOyuwotREP4GUFtt8X.TJNz.OF8yNH3cYDnHfhaO0NzNpd4ebm';
  const personalUser = await prisma.user.upsert({
    where: { email: 'romanielrai94@gmail.com' },
    update: { passwordHash: personalPasswordHash, roleId: userRole.id, clientId: personalClient.id },
    create: {
      id: 'user-0teklu',
      email: 'romanielrai94@gmail.com',
      name: 'Romaniel Rai',
      passwordHash: personalPasswordHash,
      roleId: userRole.id,
      clientId: personalClient.id
    }
  });

  console.log('Users seeded.');

  // 5. Create Projects
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-1' },
    update: {},
    create: {
      id: 'proj-1',
      name: 'Spring Leads Outreach',
      clientId: personalClient.id,
      status: 'PENDING_APPROVAL',
      progress: 0,
      agentId: null,
      startDate: null,
      estCompletion: null,
      actualCompletion: null
    }
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-2' },
    update: {},
    create: {
      id: 'proj-2',
      name: 'Cold Pipe Outbound 2026',
      clientId: personalClient.id,
      status: 'IN_PROGRESS',
      progress: 50,
      agentId: agent1.id,
      startDate: new Date(Date.now() - 86400000 * 2),
      estCompletion: new Date(Date.now() + 86400000 * 4),
      actualCompletion: null
    }
  });

  console.log('Projects seeded.');

  // 6. Create Mock Leads
  const lead1 = await prisma.lead.upsert({
    where: { id: 'lead-1' },
    update: {},
    create: {
      id: 'lead-1',
      name: 'Sarah Connor',
      company: 'Cyberdyne Systems',
      phone: '555-0199',
      email: 'sarah@skynet.com',
      notes: 'Interested in missed call recovery.',
      status: 'NEW',
      projectId: project2.id
    }
  });

  const lead2 = await prisma.lead.upsert({
    where: { id: 'lead-2' },
    update: {},
    create: {
      id: 'lead-2',
      name: 'Kyle Reese',
      company: 'Resistance Security',
      phone: '555-0122',
      email: 'kyle@resistance.net',
      notes: 'Wants automated voice test dial.',
      status: 'FOLLOW_UP',
      projectId: project2.id
    }
  });

  const lead3 = await prisma.lead.upsert({
    where: { id: 'lead-3' },
    update: {},
    create: {
      id: 'lead-3',
      name: 'Marcus Wright',
      company: 'Project Angel Inc',
      phone: '555-0187',
      email: 'marcus@angel.org',
      notes: 'Objection handled - call scheduled.',
      status: 'INTERESTED',
      projectId: project2.id
    }
  });

  const lead4 = await prisma.lead.upsert({
    where: { id: 'lead-4' },
    update: {},
    create: {
      id: 'lead-4',
      name: 'Peter Silberman',
      company: 'County Hospital',
      phone: '555-0134',
      email: 'silberman@hospital.org',
      notes: 'No answer, retry tomorrow.',
      status: 'NO_ANSWER',
      projectId: project2.id
    }
  });

  console.log('Leads seeded.');

  // 7. Create Assignments
  await prisma.assignment.upsert({
    where: { id: 'assign-1' },
    update: {},
    create: {
      id: 'assign-1',
      projectId: project2.id,
      agentId: agent1.id,
      recordCount: 1000,
      status: 'ASSIGNED'
    }
  });

  // 8. Create Notifications
  await prisma.notification.deleteMany({});
  await prisma.notification.createMany({
    data: [
      {
        id: 'notif-1',
        userId: clientUser.id,
        title: 'Database Upload Queued',
        message: 'leads_500.csv (500 records) is pending Super Admin approval.',
        channel: 'ALL',
        read: false
      },
      {
        id: 'notif-2',
        userId: clientUser.id,
        title: 'Agent Assigned',
        message: 'Agent John Connor has been assigned to Spring Tank Callouts.',
        channel: 'IN_APP',
        read: true
      }
    ]
  });

  // 9. Create Activity Logs
  await prisma.activityLog.deleteMany({});
  await prisma.activityLog.createMany({
    data: [
      {
        id: 'act-1',
        userId: clientUser.id,
        action: 'Database uploaded',
        details: 'leads_500.csv (500 records) uploaded by Client John Doe.'
      },
      {
        id: 'act-2',
        userId: clientUser.id,
        action: 'Approved by Super Admin',
        details: 'Database spring_leads.xlsx approved by Super Admin.'
      },
      {
        id: 'act-3',
        userId: clientUser.id,
        action: 'Assigned to Agent John',
        details: 'Project assigned to Agent John Connor.'
      },
      {
        id: 'act-4',
        userId: clientUser.id,
        action: 'Agent started calling',
        details: 'John Connor started outbound dials on project Spring Tank.'
      }
    ]
  });

  // 10. Create Chatbot Logs
  await prisma.chatbotLog.deleteMany({});
  await prisma.chatbotLog.createMany({
    data: [
      {
        id: 'chatlog-1',
        sessionId: 'sess-123',
        role: 'user',
        message: 'Hello, what are your pricing packages?'
      },
      {
        id: 'chatlog-2',
        sessionId: 'sess-123',
        role: 'assistant',
        message: 'We have three packages designed for real ROI. The Starter at $1,497/mo, Growth at $2,997/mo, and Dominance at $5,997/mo. Which of these sounds like the right fit for your business?'
      }
    ]
  });

  // 11. Create Audit Logs
  await prisma.auditLog.deleteMany({});
  await prisma.auditLog.create({
    data: {
      id: 'audit-1',
      userId: superadminUser.id,
      action: 'SYSTEM_BOOT',
      actor: 'system',
      details: 'CRM Platform database client instantiated in-memory.'
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
