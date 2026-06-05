import bcrypt from 'bcryptjs';

// Stateful in-memory database tables
const store: Record<string, any[]> = {
  role: [
    { id: 'role-admin', name: 'ADMIN', description: 'Administrator' },
    { id: 'role-superadmin', name: 'SUPERADMIN', description: 'Super Administrator' },
    { id: 'role-client', name: 'CLIENT', description: 'Client User' },
    { id: 'role-user', name: 'USER', description: 'Regular User' }
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
      id: 'user-admin',
      email: 'admin@gmail.com',
      name: 'Administrator',
      passwordHash: bcrypt.hashSync('AdminPass123!', 12),
      roleId: 'role-admin'
    }
  ],
  client: [
    {
      id: 'client-default',
      companyName: 'Default Client Corp',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      contactPhone: '1234567890',
      plan: 'GROWTH'
    }
  ],
  lead: [
    {
      id: 'lead-1',
      name: 'Sarah Connor',
      email: 'sarah@skynet.com',
      phone: '555-0199',
      business: 'Tech Corp',
      status: 'NEW',
      source: 'Web Form',
      clientId: 'client-default',
      createdAt: new Date()
    },
    {
      id: 'lead-2',
      name: 'John Connor',
      email: 'john@resistance.net',
      phone: '555-0122',
      business: 'Security Inc',
      status: 'CONTACTED',
      source: 'Missed Call',
      clientId: 'client-default',
      createdAt: new Date(Date.now() - 3600000)
    }
  ],
  call: [],
  sms: [],
  email: [],
  appointment: [
    {
      id: 'appt-1',
      clientId: 'client-default',
      leadId: 'lead-1',
      title: 'AI Receptionist Onboarding Consultation',
      scheduledAt: new Date(Date.now() + 86400000 * 2), // 2 days in future
      durationMin: 30,
      status: 'PENDING',
      notes: 'Wants custom script for tech support agency.'
    },
    {
      id: 'appt-2',
      clientId: 'client-default',
      leadId: 'lead-2',
      title: 'Missed Call Recovery Deep Dive',
      scheduledAt: new Date(Date.now() + 86400000 * 4), // 4 days in future
      durationMin: 45,
      status: 'CONFIRMED',
      notes: 'Interested in GHL integration.'
    }
  ],
  chatbotlog: [
    {
      id: 'chatlog-1',
      sessionId: 'sess-123',
      role: 'user',
      message: 'Hello, what are your pricing packages?',
      createdAt: new Date(Date.now() - 300000)
    },
    {
      id: 'chatlog-2',
      sessionId: 'sess-123',
      role: 'assistant',
      message: 'We have three packages designed for real ROI. The Starter at $1,497/mo, Growth at $2,997/mo, and Dominance at $5,997/mo. Which of these sounds like the right fit for your business?',
      createdAt: new Date(Date.now() - 280000)
    },
    {
      id: 'chatlog-3',
      sessionId: 'sess-123',
      role: 'user',
      message: 'I am interested in Growth.',
      createdAt: new Date(Date.now() - 250000)
    },
    {
      id: 'chatlog-4',
      sessionId: 'sess-123',
      role: 'assistant',
      message: 'Great choice! The Growth plan includes missed call recovery, CRM integration, and bi-weekly strategy calls. Would you like to book a demo call to get started?',
      createdAt: new Date(Date.now() - 240000)
    }
  ],
  voicelog: [],
  auditlog: [
    {
      id: 'audit-1',
      action: 'SYSTEM_BOOT',
      actor: 'system',
      details: 'Express Server bootstrapped with in-memory database configuration',
      ipAddress: '127.0.0.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 10)
    },
    {
      id: 'audit-2',
      action: 'USER_LOGIN',
      actor: 'superadmin@gmail.com',
      details: 'Super administrator logged in successfully',
      ipAddress: '127.0.0.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 5)
    }
  ]
};

// Sub-query matching logic
function matchesFilter(item: any, where: any): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    const filterVal = where[key];
    const itemVal = item[key];

    if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
      if ('equals' in filterVal) {
        if (itemVal !== filterVal.equals) return false;
      } else if ('contains' in filterVal) {
        if (!String(itemVal).includes(filterVal.contains)) return false;
      } else if ('in' in filterVal) {
        if (!Array.isArray(filterVal.in) || !filterVal.in.includes(itemVal)) return false;
      } else {
        if (!matchesFilter(itemVal, filterVal)) return false;
      }
    } else {
      if (itemVal !== filterVal) return false;
    }
  }
  return true;
}

// Deep resolver for Prisma includes (role relation etc.)
function resolveIncludes(modelName: string, item: any, include: any): any {
  if (!item || !include) return item;
  const resolved = { ...item };

  for (const relation of Object.keys(include)) {
    if (!include[relation]) continue;

    if (relation === 'role' && modelName === 'user') {
      const role = store.role.find(r => r.id === item.roleId);
      resolved.role = role ?? null;
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
            const filtered = items.filter(item => matchesFilter(item, args?.where));
            return filtered.length;
          };
        }

        if (isFindUniqueLike(prop)) {
          return async (args?: any) => {
            const items = store[modelName];
            if (prop === 'findMany') {
              let filtered = items.filter(item => matchesFilter(item, args?.where));
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

            const item = items.find(item => matchesFilter(item, args?.where));
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
                  return resolveIncludes(modelName, item, args?.include);
                }
                throw new Error(`Record to update not found in ${modelName}`);
              } else {
                const matching = items.filter(item => matchesFilter(item, args?.where));
                matching.forEach(item => {
                  Object.assign(item, parsedData, { updatedAt: new Date() });
                });
                return { count: matching.length };
              }
            }

            if (prop === 'delete' || prop === 'deleteMany') {
              const items = store[modelName];
              if (prop === 'delete') {
                const index = items.findIndex(item => matchesFilter(item, args?.where));
                if (index !== -1) {
                  const deleted = items.splice(index, 1)[0];
                  return resolveIncludes(modelName, deleted, args?.include);
                }
                throw new Error(`Record to delete not found in ${modelName}`);
              } else {
                const initialLength = items.length;
                store[modelName] = items.filter(item => !matchesFilter(item, args?.where));
                const deletedCount = initialLength - store[modelName].length;
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
