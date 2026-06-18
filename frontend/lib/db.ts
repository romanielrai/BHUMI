import bcrypt from 'bcryptjs';

// ─── In-memory store ────────────────────────────────────────────────────────
const store: Record<string, any[]> = {
  role: [
    { id: 'role-superadmin', name: 'SUPERADMIN', description: 'Platform Owner / Super Administrator' },
    { id: 'role-admin', name: 'ADMIN', description: 'Company Admin / Manager' },
    { id: 'role-client', name: 'CLIENT', description: 'CRM Platform Client' },
    { id: 'role-agent', name: 'AGENT', description: 'Outbound Dialing Agent' },
    { id: 'role-teamleader', name: 'TEAMLEADER', description: 'Team Leader / Supervisor' },
    { id: 'role-employee', name: 'EMPLOYEE', description: 'Regular Employee' },
  ],
  user: [
    {
      id: 'user-superadmin',
      email: 'superadmin@gmail.com',
      name: 'Super Administrator',
      passwordHash: bcrypt.hashSync('AdminPass123!', 10),
      roleId: 'role-superadmin',
      suspended: false,
      phone: '',
      status: 'ACTIVE',
      joiningDate: new Date().toISOString(),
    },
    {
      id: 'user-client',
      email: 'client@gmail.com',
      name: 'John Doe',
      passwordHash: bcrypt.hashSync('AdminPass123!', 10),
      roleId: 'role-client',
      clientId: 'client-1',
      suspended: false,
      phone: '555-0188',
      status: 'ACTIVE',
      joiningDate: new Date().toISOString(),
    },
    {
      id: 'user-agent',
      email: 'agent@gmail.com',
      name: 'John Connor',
      passwordHash: bcrypt.hashSync('AdminPass123!', 10),
      roleId: 'role-agent',
      agentId: 'agent-1',
      suspended: false,
      phone: '555-0122',
      status: 'ACTIVE',
      joiningDate: new Date().toISOString(),
    },
  ],
  client: [
    {
      id: 'client-1',
      companyName: 'Septic & Drain Specialists',
      contactName: 'John Doe',
      contactEmail: 'client@gmail.com',
      contactPhone: '555-0188',
      plan: 'GROWTH',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { id: 'client-default', companyName: 'Default Client', contactName: 'Admin', contactEmail: 'admin@portal.com', contactPhone: '', plan: 'GROWTH', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  agent: [
    { id: 'agent-1', name: 'John Connor', email: 'agent@gmail.com', phone: '555-0122', capacity: 1000, activeTasks: 2, completionRate: 92.4, status: 'AVAILABLE', createdAt: new Date().toISOString() },
    { id: 'agent-2', name: 'Sarah Connor', email: 'sarah@resistance.net', phone: '555-0199', capacity: 1000, activeTasks: 0, completionRate: 95.0, status: 'AVAILABLE', createdAt: new Date().toISOString() },
  ],
  project: [
    { id: 'proj-1', name: 'Spring Leads Outreach', clientId: 'client-1', status: 'PENDING_APPROVAL', progress: 0, agentId: null, startDate: null, estCompletion: null, actualCompletion: null, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'proj-2', name: 'Cold Pipe Outbound 2026', clientId: 'client-1', status: 'IN_PROGRESS', progress: 50, agentId: 'agent-1', startDate: new Date(Date.now() - 86400000 * 2).toISOString(), estCompletion: new Date(Date.now() + 86400000 * 4).toISOString(), actualCompletion: null, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  ],
  uploadedfile: [
    { id: 'file-1', fileName: 'leads_500.csv', fileType: 'CSV', recordCount: 500, status: 'PENDING_APPROVAL', clientId: 'client-1', projectId: 'proj-1', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'file-2', fileName: 'spring_leads.xlsx', fileType: 'Excel', recordCount: 1000, status: 'APPROVED', clientId: 'client-1', projectId: 'proj-2', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  ],
  lead: [
    { id: 'lead-1', name: 'Sarah Connor', company: 'Cyberdyne Systems', phone: '555-0199', email: 'sarah@skynet.com', notes: 'Interested in missed call recovery.', status: 'NEW', projectId: 'proj-2', userId: null, clientId: 'client-1', createdAt: new Date().toISOString() },
    { id: 'lead-2', name: 'Kyle Reese', company: 'Resistance Security', phone: '555-0122', email: 'kyle@resistance.net', notes: 'Wants automated voice test dial.', status: 'FOLLOW_UP', projectId: 'proj-2', userId: null, clientId: 'client-1', createdAt: new Date().toISOString() },
    { id: 'lead-3', name: 'Marcus Wright', company: 'Project Angel Inc', phone: '555-0187', email: 'marcus@angel.org', notes: 'Objection handled - call scheduled.', status: 'INTERESTED', projectId: 'proj-2', userId: null, clientId: 'client-1', createdAt: new Date().toISOString() },
    { id: 'lead-4', name: 'Peter Silberman', company: 'County Hospital', phone: '555-0134', email: 'silberman@hospital.org', notes: 'No answer, retry tomorrow.', status: 'NO_ANSWER', projectId: 'proj-2', userId: null, clientId: 'client-1', createdAt: new Date().toISOString() },
  ],
  assignment: [
    { id: 'assign-1', projectId: 'proj-2', agentId: 'agent-1', recordCount: 1000, status: 'ASSIGNED', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  ],
  notification: [
    { id: 'notif-1', userId: 'user-client', title: 'Database Upload Queued', message: 'leads_500.csv (500 records) is pending Super Admin approval.', channel: 'ALL', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'notif-2', userId: 'user-client', title: 'Agent Assigned', message: 'Agent John Connor has been assigned to Spring Tank Callouts.', channel: 'IN_APP', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  ],
  activitylog: [
    { id: 'act-1', userId: 'user-client', action: 'Database uploaded', details: 'leads_500.csv uploaded.', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'act-2', userId: 'user-client', action: 'Approved by Super Admin', details: 'Database spring_leads.xlsx approved.', createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString() },
  ],
  voicetest: [],
  calltranscript: [],
  auditlog: [
    { id: 'audit-1', userId: 'user-superadmin', action: 'SYSTEM_BOOT', actor: 'system', details: 'CRM Platform initialized.', ipAddress: '127.0.0.1', createdAt: new Date().toISOString() },
  ],
  chatbotlog: [],
  designation: [],
  call: [],
  appointment: [],
};

// ─── Helper: filter items ────────────────────────────────────────────────────
function matchesFilter(item: any, where: any): boolean {
  if (!where) return true;
  if (!item) return false;
  for (const key of Object.keys(where)) {
    const filterVal = where[key];
    const itemVal = item[key];
    if (filterVal !== null && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
      if ('in' in filterVal) {
        if (!Array.isArray(filterVal.in) || !filterVal.in.includes(itemVal)) return false;
      } else if ('equals' in filterVal) {
        if (itemVal !== filterVal.equals) return false;
      } else if ('contains' in filterVal) {
        if (!String(itemVal ?? '').toLowerCase().includes(String(filterVal.contains).toLowerCase())) return false;
      } else {
        // nested object comparison (simple equality)
        if (itemVal !== filterVal) return false;
      }
    } else {
      if (itemVal !== filterVal) return false;
    }
  }
  return true;
}

// ─── Relation resolver ───────────────────────────────────────────────────────
function resolveIncludes(modelName: string, item: any, include: any): any {
  if (!item || !include) return item;
  const resolved = { ...item };
  for (const relation of Object.keys(include)) {
    if (!include[relation]) continue;
    if (relation === 'role' && modelName === 'user') resolved.role = store.role.find(r => r.id === item.roleId) ?? null;
    if (relation === 'client' && modelName === 'user') resolved.client = store.client.find(c => c.id === item.clientId) ?? null;
    if (relation === 'agent' && modelName === 'user') resolved.agent = store.agent.find(a => a.id === item.agentId) ?? null;
    if (relation === 'designation' && modelName === 'user') resolved.designation = store.designation.find((d: any) => d.id === item.designationId) ?? null;
    if (relation === 'client' && modelName === 'project') resolved.client = store.client.find(c => c.id === item.clientId) ?? null;
    if (relation === 'agent' && modelName === 'project') resolved.agent = store.agent.find(a => a.id === item.agentId) ?? null;
    if (relation === 'leads' && modelName === 'project') resolved.leads = store.lead.filter(l => l.projectId === item.id);
    if (relation === 'assignments' && modelName === 'project') resolved.assignments = store.assignment.filter(a => a.projectId === item.id);
    if (relation === 'uploadedFiles' && modelName === 'project') resolved.uploadedFiles = store.uploadedfile.filter(f => f.projectId === item.id);
    if (relation === 'lead' && modelName === 'call') resolved.lead = store.lead.find(l => l.id === item.leadId) ?? null;
  }
  return resolved;
}

// ─── Proxy model factory ─────────────────────────────────────────────────────
function createModel(name: string): any {
  const key = name.toLowerCase();
  if (!store[key]) store[key] = [];

  return {
    async findMany(args?: any) {
      let items = store[key].filter(item => matchesFilter(item, args?.where));
      if (args?.orderBy) {
        const [orderKey, dir] = Object.entries(args.orderBy)[0] as [string, string];
        items = [...items].sort((a, b) => {
          const va = a[orderKey], vb = b[orderKey];
          if (va < vb) return dir === 'desc' ? 1 : -1;
          if (va > vb) return dir === 'desc' ? -1 : 1;
          return 0;
        });
      }
      if (args?.take) items = items.slice(0, args.take);
      return items.map(i => resolveIncludes(key, i, args?.include));
    },
    async findFirst(args?: any) {
      const item = store[key].find(i => matchesFilter(i, args?.where));
      return item ? resolveIncludes(key, item, args?.include) : null;
    },
    async findUnique(args?: any) {
      const item = store[key].find(i => matchesFilter(i, args?.where));
      return item ? resolveIncludes(key, item, args?.include) : null;
    },
    async count(args?: any) {
      return store[key].filter(i => matchesFilter(i, args?.where)).length;
    },
    async create(args?: any) {
      const data = args?.data ?? {};
      const parsed: any = {};
      for (const k of Object.keys(data)) {
        const v = data[k];
        if (v && typeof v === 'object' && 'connect' in v && v.connect?.id) parsed[`${k}Id`] = v.connect.id;
        else if (k === 'increment') { /* skip */ }
        else parsed[k] = v;
      }
      const newRecord = {
        id: data.id || `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...parsed,
      };
      store[key].push(newRecord);
      return resolveIncludes(key, newRecord, args?.include);
    },
    async update(args?: any) {
      const data = args?.data ?? {};
      const parsed: any = {};
      for (const k of Object.keys(data)) {
        const v = data[k];
        if (v && typeof v === 'object' && 'connect' in v && v.connect?.id) parsed[`${k}Id`] = v.connect.id;
        else if (v && typeof v === 'object' && 'increment' in v) {
          // handled below
          parsed[`__inc_${k}`] = v.increment;
        }
        else parsed[k] = v;
      }
      const item = store[key].find(i => matchesFilter(i, args?.where));
      if (!item) throw new Error(`Record not found in ${key}`);
      for (const k of Object.keys(parsed)) {
        if (k.startsWith('__inc_')) {
          const realKey = k.replace('__inc_', '');
          item[realKey] = (item[realKey] || 0) + parsed[k];
        } else {
          item[k] = parsed[k];
        }
      }
      item.updatedAt = new Date().toISOString();
      return resolveIncludes(key, item, args?.include);
    },
    async updateMany(args?: any) {
      const data = args?.data ?? {};
      const matching = store[key].filter(i => matchesFilter(i, args?.where));
      matching.forEach(item => { Object.assign(item, data, { updatedAt: new Date().toISOString() }); });
      return { count: matching.length };
    },
    async delete(args?: any) {
      const idx = store[key].findIndex(i => matchesFilter(i, args?.where));
      if (idx === -1) throw new Error(`Record not found in ${key}`);
      const deleted = store[key].splice(idx, 1)[0];
      return resolveIncludes(key, deleted, args?.include);
    },
    async deleteMany(args?: any) {
      const before = store[key].length;
      store[key] = store[key].filter(i => !matchesFilter(i, args?.where));
      return { count: before - store[key].length };
    },
    async upsert(args?: any) {
      const item = store[key].find(i => matchesFilter(i, args?.where));
      if (item) {
        Object.assign(item, args?.update ?? {}, { updatedAt: new Date().toISOString() });
        return resolveIncludes(key, item, args?.include);
      }
      const data = { ...(args?.create ?? {}), id: `${key}-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      store[key].push(data);
      return resolveIncludes(key, data, args?.include);
    },
  };
}

// ─── PrismaClient singleton ──────────────────────────────────────────────────
class PrismaClient {
  user = createModel('user');
  role = createModel('role');
  client = createModel('client');
  agent = createModel('agent');
  project = createModel('project');
  uploadedFile = createModel('uploadedfile');
  lead = createModel('lead');
  assignment = createModel('assignment');
  notification = createModel('notification');
  activityLog = createModel('activitylog');
  auditLog = createModel('auditlog');
  chatbotLog = createModel('chatbotlog');
  voiceTest = createModel('voicetest');
  callTranscript = createModel('calltranscript');
  designation = createModel('designation');
  call = createModel('call');
  appointment = createModel('appointment');
  dailyPlanner = createModel('dailyplanner');
  dailyUpdate = createModel('dailyupdate');

  async $connect() {}
  async $disconnect() {}
  async $transaction(ops: any) {
    if (typeof ops === 'function') return ops(this);
    return Promise.all(ops);
  }
}

// Global singleton for serverless
const globalForPrisma = globalThis as any;
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = new PrismaClient());
