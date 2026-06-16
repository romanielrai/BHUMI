import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Stateful in-memory database tables
const store: Record<string, any[]> = {
  role: [
    { id: 'role-superadmin', name: 'SUPERADMIN', description: 'Platform Owner / Super Administrator' },
    { id: 'role-admin', name: 'ADMIN', description: 'System Administrator' },
    { id: 'role-client', name: 'CLIENT', description: 'CRM Platform Client' },
    { id: 'role-agent', name: 'AGENT', description: 'Outbound Dialing Agent' }
  ],
  user: [
    {
      id: 'user-superadmin',
      email: 'superadmin@gmail.com',
      name: 'Super Administrator',
      passwordHash: bcrypt.hashSync('AdminPass123!', 12),
      roleId: 'role-superadmin'
    },
    {
      id: 'user-client',
      email: 'client@gmail.com',
      name: 'John Doe',
      passwordHash: bcrypt.hashSync('AdminPass123!', 12),
      roleId: 'role-client',
      clientId: 'client-1'
    },
    {
      id: 'user-agent',
      email: 'agent@gmail.com',
      name: 'John Connor',
      passwordHash: bcrypt.hashSync('AdminPass123!', 12),
      roleId: 'role-agent',
      agentId: 'agent-1'
    }
  ],
  client: [
    {
      id: 'client-1',
      companyName: 'Septic & Drain Specialists',
      contactName: 'John Doe',
      contactEmail: 'client@gmail.com',
      contactPhone: '555-0188',
      status: 'ACTIVE'
    }
  ],
  agent: [
    {
      id: 'agent-1',
      name: 'John Connor',
      email: 'agent@gmail.com',
      phone: '555-0122',
      capacity: 1000,
      activeTasks: 2,
      completionRate: 92.4,
      status: 'AVAILABLE'
    },
    {
      id: 'agent-2',
      name: 'Sarah Connor',
      email: 'sarah@resistance.net',
      phone: '555-0199',
      capacity: 1000,
      activeTasks: 0,
      completionRate: 95.0,
      status: 'AVAILABLE'
    }
  ],
  project: [
    {
      id: 'proj-1',
      name: 'Spring Leads Outreach',
      clientId: 'client-1',
      status: 'PENDING_APPROVAL',
      progress: 0,
      agentId: null,
      startDate: null,
      estCompletion: null,
      actualCompletion: null,
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      id: 'proj-2',
      name: 'Cold Pipe Outbound 2026',
      clientId: 'client-1',
      status: 'IN_PROGRESS',
      progress: 50,
      agentId: 'agent-1',
      startDate: new Date(Date.now() - 86400000 * 2),
      estCompletion: new Date(Date.now() + 86400000 * 4),
      actualCompletion: null,
      createdAt: new Date(Date.now() - 86400000 * 2)
    }
  ],
  uploadedfile: [
    {
      id: 'file-1',
      fileName: 'leads_500.csv',
      fileType: 'CSV',
      recordCount: 500,
      status: 'PENDING_APPROVAL',
      clientId: 'client-1',
      projectId: 'proj-1',
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      id: 'file-2',
      fileName: 'spring_leads.xlsx',
      fileType: 'Excel',
      recordCount: 1000,
      status: 'APPROVED',
      clientId: 'client-1',
      projectId: 'proj-2',
      createdAt: new Date(Date.now() - 86400000 * 2)
    }
  ],
  lead: [
    { id: 'lead-1', name: 'Sarah Connor', company: 'Cyberdyne Systems', phone: '555-0199', email: 'sarah@skynet.com', notes: 'Interested in missed call recovery.', status: 'NEW', projectId: 'proj-2', createdAt: new Date() },
    { id: 'lead-2', name: 'Kyle Reese', company: 'Resistance Security', phone: '555-0122', email: 'kyle@resistance.net', notes: 'Wants automated voice test dial.', status: 'FOLLOW_UP', projectId: 'proj-2', createdAt: new Date() },
    { id: 'lead-3', name: 'Marcus Wright', company: 'Project Angel Inc', phone: '555-0187', email: 'marcus@angel.org', notes: 'Objection handled - call scheduled.', status: 'INTERESTED', projectId: 'proj-2', createdAt: new Date() },
    { id: 'lead-4', name: 'Peter Silberman', company: 'County Hospital', phone: '555-0134', email: 'silberman@hospital.org', notes: 'No answer, retry tomorrow.', status: 'NO_ANSWER', projectId: 'proj-2', createdAt: new Date() }
  ],
  assignment: [
    {
      id: 'assign-1',
      projectId: 'proj-2',
      agentId: 'agent-1',
      recordCount: 1000,
      status: 'ASSIGNED',
      createdAt: new Date(Date.now() - 86400000 * 2)
    }
  ],
  notification: [
    { id: 'notif-1', userId: 'user-client', title: 'Database Upload Queued', message: 'leads_500.csv (500 records) is pending Super Admin approval.', channel: 'ALL', read: false, createdAt: new Date(Date.now() - 3600000) },
    { id: 'notif-2', userId: 'user-client', title: 'Agent Assigned', message: 'Agent John Connor has been assigned to Spring Tank Callouts.', channel: 'IN_APP', read: true, createdAt: new Date(Date.now() - 86400000) }
  ],
  activitylog: [
    { id: 'act-1', userId: 'user-client', action: 'Database uploaded', details: 'leads_500.csv (500 records) uploaded by Client John Doe.', createdAt: new Date(Date.now() - 3600000) },
    { id: 'act-2', userId: 'user-client', action: 'Approved by Super Admin', details: 'Database spring_leads.xlsx approved by Super Admin.', createdAt: new Date(Date.now() - 86400000 * 1.5) },
    { id: 'act-3', userId: 'user-client', action: 'Assigned to Agent John', details: 'Project assigned to Agent John Connor.', createdAt: new Date(Date.now() - 86400000) },
    { id: 'act-4', userId: 'user-client', action: 'Agent started calling', details: 'John Connor started outbound dials on project Spring Tank.', createdAt: new Date(Date.now() - 43200000) }
  ],
  voicetest: [],
  calltranscript: [],
  auditlog: [
    { id: 'audit-1', userId: 'user-superadmin', action: 'SYSTEM_BOOT', actor: 'system', details: 'CRM Platform database client instantiated in-memory.', ipAddress: '127.0.0.1', createdAt: new Date() }
  ],
  chatbotlog: []
};

const DB_FILE_PATH = path.resolve(__dirname, '../prisma/db.json');

function saveStore() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save persistent mock database:', error);
  }
}

// Load database on import
try {
  if (fs.existsSync(DB_FILE_PATH)) {
    const rawData = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(rawData);
    for (const key of Object.keys(parsed)) {
      store[key] = parsed[key].map((item: any) => {
        const processed = { ...item };
        for (const prop of Object.keys(processed)) {
          if (typeof processed[prop] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(processed[prop])) {
            processed[prop] = new Date(processed[prop]);
          }
        }
        return processed;
      });
    }
    console.log('Successfully loaded persistent mock database.');
  } else {
    saveStore();
  }
} catch (error) {
  console.error('Failed to load persistent mock database:', error);
}

// Helper to dynamically resolve relation values in matchesFilter
function getRelationValue(modelName: string, item: any, relationKey: string): any {
  const model = modelName.toLowerCase();
  const rel = relationKey.toLowerCase();

  if (model === 'user') {
    if (rel === 'role') return store.role.find(r => r.id === item.roleId);
    if (rel === 'client') return store.client.find(c => c.id === item.clientId);
    if (rel === 'agent') return store.agent.find(a => a.id === item.agentId);
  }
  if (model === 'project') {
    if (rel === 'client') return store.client.find(c => c.id === item.clientId);
    if (rel === 'agent') return store.agent.find(a => a.id === item.agentId);
    if (rel === 'leads') return store.lead.filter(l => l.projectId === item.id);
    if (rel === 'uploadedfiles') return store.uploadedfile.filter(f => f.projectId === item.id);
    if (rel === 'assignments') return store.assignment.filter(a => a.projectId === item.id);
  }
  if (model === 'notification') {
    if (rel === 'user') return store.user.find(u => u.id === item.userId);
  }
  if (model === 'lead') {
    if (rel === 'project') return store.project.find(p => p.id === item.projectId);
    if (rel === 'user') return store.user.find(u => u.id === item.userId);
  }
  return undefined;
}

// Sub-query matching logic
function matchesFilter(item: any, where: any, modelName?: string): boolean {
  if (!where) return true;
  if (!item) return false;

  for (const key of Object.keys(where)) {
    const filterVal = where[key];
    let itemVal = item[key];

    // Handle nested relation filter if itemVal is undefined and we have modelName context
    if (itemVal === undefined && modelName) {
      const resolved = getRelationValue(modelName, item, key);
      if (resolved !== undefined) {
        itemVal = resolved;
      }
    }

    if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
      if ('equals' in filterVal) {
        if (itemVal !== filterVal.equals) return false;
      } else if ('contains' in filterVal) {
        if (!String(itemVal).includes(filterVal.contains)) return false;
      } else if ('in' in filterVal) {
        if (!Array.isArray(filterVal.in) || !filterVal.in.includes(itemVal)) return false;
      } else {
        const nextModelName = key;
        if (!matchesFilter(itemVal, filterVal, nextModelName)) return false;
      }
    } else {
      if (itemVal !== filterVal) return false;
    }
  }
  return true;
}

// Deep resolver for Prisma includes
function resolveIncludes(modelName: string, item: any, include: any): any {
  if (!item || !include) return item;
  const resolved = { ...item };

  for (const relation of Object.keys(include)) {
    if (!include[relation]) continue;

    if (relation === 'role' && modelName === 'user') {
      const role = store.role.find(r => r.id === item.roleId);
      resolved.role = role ?? null;
    }

    if (relation === 'client' && modelName === 'user') {
      const client = store.client.find(c => c.id === item.clientId);
      resolved.client = client ?? null;
    }

    if (relation === 'agent' && modelName === 'user') {
      const agent = store.agent.find(a => a.id === item.agentId);
      resolved.agent = agent ?? null;
    }

    if (relation === 'client' && modelName === 'project') {
      const client = store.client.find(c => c.id === item.clientId);
      resolved.client = client ?? null;
    }

    if (relation === 'agent' && modelName === 'project') {
      const agent = store.agent.find(a => a.id === item.agentId);
      resolved.agent = agent ?? null;
    }

    if (relation === 'leads' && modelName === 'project') {
      resolved.leads = store.lead.filter(l => l.projectId === item.id);
    }

    if (relation === 'assignments' && modelName === 'project') {
      resolved.assignments = store.assignment.filter(a => a.projectId === item.id);
    }

    if (relation === 'uploadedFiles' && modelName === 'project') {
      resolved.uploadedFiles = store.uploadedfile.filter(f => f.projectId === item.id);
    }

    if (relation === 'user' && modelName === 'notification') {
      const u = store.user.find(usr => usr.id === item.userId);
      resolved.user = u ?? null;
    }
  }
  return resolved;
}

function isCreateLike(prop: string) {
  return [
    'create',
    'update',
    'upsert',
    'delete',
    'connect',
    'disconnect',
    'updateMany',
    'createMany',
    'deleteMany'
  ].includes(prop);
}

function isFindUniqueLike(prop: string) {
  return ['findUnique', 'findFirst', 'findMany'].includes(prop);
}

function isCountLike(prop: string) {
  return prop === 'count';
}

function isAggregateLike(prop: string) {
  return ['aggregate', 'groupBy'].includes(prop);
}

function createModelProxy(name: string): any {
  const modelName = name.toLowerCase();
  if (!store[modelName]) {
    store[modelName] = [];
  }

  return new Proxy(
    {},
    {
      get(_target, property) {
        const prop = String(property);
        if (prop === 'then') return undefined;

        if (isCountLike(prop)) {
          return async (args?: any) => {
            const items = store[modelName];
            const filtered = items.filter(item => matchesFilter(item, args?.where, modelName));
            return filtered.length;
          };
        }

        if (isFindUniqueLike(prop)) {
          return async (args?: any) => {
            const items = store[modelName];
            if (prop === 'findMany') {
              let filtered = items.filter(item => matchesFilter(item, args?.where, modelName));
              if (args?.orderBy) {
                const orderKey = Object.keys(args.orderBy)[0];
                const orderDirection = args.orderBy[orderKey];
                filtered = [...filtered].sort((a, b) => {
                  const valA = a[orderKey];
                  const valB = b[orderKey];
                  if (valA instanceof Date && valB instanceof Date) {
                    return orderDirection === 'desc' ? valB.getTime() - valA.getTime() : valA.getTime() - valB.getTime();
                  }
                  if (valA < valB) return orderDirection === 'desc' ? 1 : -1;
                  if (valA > valB) return orderDirection === 'desc' ? -1 : 1;
                  return 0;
                });
              }
              return filtered.map(item => resolveIncludes(modelName, item, args?.include));
            }

            const item = items.find(item => matchesFilter(item, args?.where, modelName));
            return item ? resolveIncludes(modelName, item, args?.include) : null;
          };
        }

        if (isCreateLike(prop)) {
          return async (args?: any) => {
            if (prop === 'create' || prop === 'createMany') {
              const data = args?.data ?? {};
              const records = Array.isArray(data) ? data : [data];
              const createdRecords = [];

              for (const singleData of records) {
                const parsedData: Record<string, any> = {};
                for (const key of Object.keys(singleData)) {
                  const val = singleData[key];
                  if (val && typeof val === 'object' && 'connect' in val && val.connect?.id) {
                    parsedData[`${key}Id`] = val.connect.id;
                  } else {
                    parsedData[key] = val;
                  }
                }

                const newRecord = {
                  id: singleData.id || `${modelName}-${Math.random().toString(36).substring(7)}`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  ...parsedData
                };

                store[modelName].push(newRecord);
                createdRecords.push(newRecord);
              }

              const result = Array.isArray(data) ? createdRecords : createdRecords[0];
              saveStore();
              return resolveIncludes(modelName, result, args?.include);
            }

            if (prop === 'update' || prop === 'updateMany') {
              const data = args?.data ?? {};
              const parsedData: Record<string, any> = {};
              for (const key of Object.keys(data)) {
                const val = data[key];
                if (val && typeof val === 'object' && 'connect' in val && val.connect?.id) {
                  parsedData[`${key}Id`] = val.connect.id;
                } else {
                  parsedData[key] = val;
                }
              }

              const items = store[modelName];
              if (prop === 'update') {
                const item = items.find(item => matchesFilter(item, args?.where));
                if (item) {
                  Object.assign(item, parsedData, { updatedAt: new Date() });
                  saveStore();
                  return resolveIncludes(modelName, item, args?.include);
                }
                throw new Error(`Record to update not found in ${modelName}`);
              } else {
                const matching = items.filter(item => matchesFilter(item, args?.where));
                matching.forEach(item => {
                  Object.assign(item, parsedData, { updatedAt: new Date() });
                });
                saveStore();
                return { count: matching.length };
              }
            }

            if (prop === 'delete' || prop === 'deleteMany') {
              const items = store[modelName];
              if (prop === 'delete') {
                const index = items.findIndex(item => matchesFilter(item, args?.where));
                if (index !== -1) {
                  const deleted = items.splice(index, 1)[0];
                  saveStore();
                  return resolveIncludes(modelName, deleted, args?.include);
                }
                throw new Error(`Record to delete not found in ${modelName}`);
              } else {
                const initialLength = items.length;
                store[modelName] = items.filter(item => !matchesFilter(item, args?.where));
                const deletedCount = initialLength - store[modelName].length;
                saveStore();
                return { count: deletedCount };
              }
            }

            // Fallback
            const data = args?.data ?? {};
            const parsedData: Record<string, any> = {};
            for (const key of Object.keys(data)) {
              const val = data[key];
              if (val && typeof val === 'object' && 'connect' in val && val.connect?.id) {
                parsedData[`${key}Id`] = val.connect.id;
              } else {
                parsedData[key] = val;
              }
            }
            const newRecord = {
              id: `${modelName}-${Math.random().toString(36).substring(7)}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...parsedData
            };
            store[modelName].push(newRecord);
            saveStore();
            return resolveIncludes(modelName, newRecord, args?.include);
          };
        }

        if (isAggregateLike(prop)) {
          return async () => ({});
        }

        if (prop === '$disconnect' || prop === '$connect') {
          return async () => undefined;
        }

        if (prop === '$transaction') {
          return async (ops: any) => {
            if (typeof ops === 'function') return ops();
            return [];
          };
        }

        return createModelProxy(`${name}.${prop}`);
      }
    }
  );
}

export class PrismaClient {
  [key: string]: any;

  constructor() {
    return new Proxy(this, {
      get: (_target, property) => {
        const prop = String(property);
        if (prop === 'then') return undefined;

        if (prop === '$connect' || prop === '$disconnect') {
          return async () => undefined;
        }

        if (prop === '$transaction') {
          return async (ops: any) => {
            if (typeof ops === 'function') return ops();
            return [];
          };
        }

        return createModelProxy(prop);
      }
    }) as any;
  }
}
