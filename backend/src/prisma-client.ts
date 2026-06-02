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
  appointment: [],
  chatbotlog: [],
  voicelog: [],
  auditlog: []
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
