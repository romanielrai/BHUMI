'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Users, ListCollapse, Activity, Settings, RefreshCw, 
  Plus, Edit2, Trash2, Check, X, Save, AlertCircle, Cpu, HardDrive, 
  Link, Clock, UserCheck, ShieldCheck, Mail, Lock
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  suspended: boolean;
  roleId: string;
  role?: { name: string };
}

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

interface ChatbotLog {
  id: string;
  leadId?: string;
  userMessage: string;
  botResponse: string;
  createdAt: string;
}

interface Health {
  uptime: number;
  memory: { rss: number; heapTotal: number; heapUsed: number };
  metrics: { apiLatencyMs: number; dbLatencyMs: number; activeConnections: number };
  integrations: { databaseType: string; databaseConnection: string; openai: string; twilio: string };
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'health' | 'users' | 'audit' | 'chatlogs' | 'configs'>('health');
  const [loading, setLoading] = useState(true);

  // --- State Variables ---
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [chatbotLogs, setChatbotLogs] = useState<ChatbotLog[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [globalConfigs, setGlobalConfigs] = useState<any>({});
  const [configStatus, setConfigStatus] = useState('');

  // User Form Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userFormStatus, setUserFormStatus] = useState('');
  const [userForm, setUserForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    roleName: 'CLIENT',
    suspended: false
  });

  // --- Fetch API Data ---
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);

      // 1. Fetch System Health
      const healthRes = await fetch('/api/superadmin/system-health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealth(data);
      }

      // 2. Fetch Platform Users
      const usersRes = await fetch('/api/superadmin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      // 3. Fetch Audit Logs
      const auditRes = await fetch('/api/superadmin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }

      // 4. Fetch Conversation Logs
      const chatLogsRes = await fetch('/api/superadmin/conversation-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (chatLogsRes.ok) {
        const data = await chatLogsRes.json();
        setChatbotLogs(data.logs || []);
      }

      // 5. Fetch Global Configs
      const configsRes = await fetch('/api/superadmin/configs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (configsRes.ok) {
        const data = await configsRes.json();
        setGlobalConfigs(data.configs || {});
      }

    } catch (err) {
      console.error('Fetch superadmin details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // SSE Stream Integration
    const sse = new EventSource('/api/crm/stream');
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ACTIVITY_LOG' || data.type === 'NOTIFICATION') {
          fetchData();
        }
      } catch (err) {
        // ignore
      }
    };

    return () => {
      sse.close();
    };
  }, []);

  // --- User Directory Actions ---
  const openAddUserModal = () => {
    setUserForm({
      id: '',
      name: '',
      email: '',
      password: '',
      roleName: 'CLIENT',
      suspended: false
    });
    setIsEditingUser(false);
    setUserFormStatus('');
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (u: User) => {
    setUserForm({
      id: u.id,
      name: u.name || '',
      email: u.email,
      password: '', // Leave blank to avoid changing password
      roleName: u.role?.name || 'CLIENT',
      suspended: u.suspended
    });
    setIsEditingUser(true);
    setUserFormStatus('');
    setIsUserModalOpen(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setUserFormStatus('Saving account details...');

    try {
      const url = isEditingUser 
        ? `/api/superadmin/users/${userForm.id}` 
        : '/api/superadmin/users';
      const method = isEditingUser ? 'PATCH' : 'POST';

      // Discard blank password on edit
      const payload: any = { ...userForm };
      if (isEditingUser && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setUserFormStatus('Saved successfully!');
        fetchData();
        setTimeout(() => setIsUserModalOpen(false), 800);
      } else {
        const data = await res.json();
        setUserFormStatus(data.error || 'Failed to save user account.');
      }
    } catch {
      setUserFormStatus('Network error.');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/superadmin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete user.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const toggleSuspension = async (u: User) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/superadmin/users/${u.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ suspended: !u.suspended })
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      alert('Error updating user.');
    }
  };

  // --- Config Editor Action ---
  const saveGlobalConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setConfigStatus('Updating system settings...');

    try {
      const res = await fetch('/api/superadmin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(globalConfigs)
      });

      if (res.ok) {
        setConfigStatus('Global configs updated successfully!');
        setTimeout(() => setConfigStatus(''), 4000);
        fetchData();
      } else {
        setConfigStatus('Failed to update configs.');
      }
    } catch {
      setConfigStatus('Network error.');
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (loading && !health) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/50">
        <p className="animate-pulse text-xs uppercase tracking-widest font-bold text-purple-400">Syncing SuperAdmin Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ── TABS SELECTOR ── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-5">
        {[
          { id: 'health', label: 'System Health', icon: Cpu },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'audit', label: 'Audit Trails', icon: ListCollapse },
          { id: 'chatlogs', label: 'AI Chatbot Logs', icon: Clock },
          { id: 'configs', label: 'Global Parameters', icon: Settings }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === t.id 
                  ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-glow-sm' 
                  : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── SYSTEM HEALTH TAB ── */}
      {activeTab === 'health' && health && (
        <div className="space-y-8 text-left">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {/* Uptime */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-white/50 text-[10px] tracking-widest uppercase font-bold">
                <span>System Uptime</span>
                <Clock size={14} className="text-purple-400" />
              </div>
              <p className="mt-3 text-2xl font-bold font-mono text-white">{formatUptime(health.uptime)}</p>
            </div>
            {/* Active Connections */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-white/50 text-[10px] tracking-widest uppercase font-bold">
                <span>API Connections</span>
                <Activity size={14} className="text-purple-400" />
              </div>
              <p className="mt-3 text-2xl font-bold font-mono text-purple-300">{health.metrics?.activeConnections || 0} active</p>
            </div>
            {/* API Latency */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-white/50 text-[10px] tracking-widest uppercase font-bold">
                <span>API Latency</span>
                <Activity size={14} className="text-purple-400" />
              </div>
              <p className="mt-3 text-2xl font-bold font-mono text-purple-300">{health.metrics?.apiLatencyMs || 0} ms</p>
            </div>
            {/* RAM heap Used */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-white/50 text-[10px] tracking-widest uppercase font-bold">
                <span>RAM usage</span>
                <HardDrive size={14} className="text-purple-400" />
              </div>
              <p className="mt-3 text-2xl font-bold font-mono text-white">{health.memory?.heapUsed || 0} MB / {health.memory?.heapTotal} MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Integrations checklist */}
            <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2">
                <Link size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white font-sans">Active Integrations Check</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Database Adapter', type: health.integrations?.databaseType || 'Local Emulator', status: health.integrations?.databaseConnection || 'CONNECTED' },
                  { name: 'OpenAI (GPT Specialized Sockets)', type: 'Lead Chatbot & AI Voice Analysis', status: health.integrations?.openai || 'LIVE' },
                  { name: 'Twilio Dialer API Link', type: 'Live Outbound dialers and calls routing', status: health.integrations?.twilio || 'SIMULATED' }
                ].map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-white/80">{i.name}</span>
                      <span className="block text-[10px] text-white/40">{i.type}</span>
                    </div>
                    <span className={`text-[8.5px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                      i.status === 'CONNECTED' || i.status === 'LIVE' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance status details */}
            <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white font-sans">Diagnostics Summary</h3>
              </div>
              <div className="space-y-3.5 text-xs text-white/70 leading-relaxed font-sans">
                <p>All core sub-processes are operating correctly. Sockets connection is healthy and streaming lead updates instantly to visual panels.</p>
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-2 font-mono text-2xs">
                  <div className="flex justify-between">
                    <span>Process RSS:</span>
                    <span>{health.memory?.rss} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database Latency:</span>
                    <span>{health.metrics?.dbLatencyMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Queue Status:</span>
                    <span className="text-emerald-400">Idle / Healthy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USER DIRECTORY TAB ── */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-purple-400" />
              <h2 className="text-lg font-bold text-white">System User Directory</h2>
            </div>
            <button
              onClick={openAddUserModal}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 text-xs font-bold transition"
            >
              <Plus size={14} />
              <span>Add System User</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">User Details</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Account Security</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-white/30">No platform users registered.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">{u.name || 'Specialist'}</p>
                          <p className="text-2xs text-white/40">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-purple-300">
                          {u.role?.name || 'CLIENT'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleSuspension(u)}
                          className={`rounded px-2.5 py-0.5 text-2xs font-extrabold transition ${
                            u.suspended 
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/35' 
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/35'
                          }`}
                        >
                          {u.suspended ? 'SUSPENDED' : 'ACTIVE'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => openEditUserModal(u)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                          title="Edit"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-950/20 border border-red-500/20 text-red-300 hover:bg-red-900/30 transition"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── USER MODAL ── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#060b1b] p-6 space-y-5 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck size={16} className="text-purple-400" />
                <span>{isEditingUser ? 'Edit User Profile' : 'Add New System User'}</span>
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveUser} className="space-y-4">
              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">User Full Name</label>
                <input
                  required
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. John Connor"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1 flex items-center gap-1">
                  <Mail size={10} />
                  <span>User Email</span>
                </label>
                <input
                  required
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. email@domain.com"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1 flex items-center gap-1">
                  <Lock size={10} />
                  <span>Password {isEditingUser && '(leave blank to keep unchanged)'}</span>
                </label>
                <input
                  type="password"
                  required={!isEditingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Set login password..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">System Role</label>
                  <select
                    value={userForm.roleName}
                    onChange={(e) => setUserForm({ ...userForm, roleName: e.target.value })}
                    className="w-full rounded-xl bg-background border border-white/10 px-2 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                  >
                    <option value="SUPERADMIN">Super Admin</option>
                    <option value="ADMIN">Company Admin</option>
                    <option value="AGENT">Outbound Agent</option>
                    <option value="CLIENT">Client Portal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Account Suspension</label>
                  <select
                    value={userForm.suspended ? 'true' : 'false'}
                    onChange={(e) => setUserForm({ ...userForm, suspended: e.target.value === 'true' })}
                    className="w-full rounded-xl bg-background border border-white/10 px-2 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                  >
                    <option value="false">Active / Unrestricted</option>
                    <option value="true">Suspended / Locked</option>
                  </select>
                </div>
              </div>

              {userFormStatus && (
                <p className="text-xs text-gold animate-pulse text-center">{userFormStatus}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="w-1/2 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 text-xs font-bold text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white py-2.5 text-xs font-bold transition"
                >
                  Save Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── AUDIT TRAILS TAB ── */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-purple-400" />
              <h2 className="text-lg font-bold text-white">Security & Audit Log Trails</h2>
            </div>
            <button onClick={fetchData} className="text-white/40 hover:text-white transition">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor Email</th>
                  <th className="px-4 py-3">Details / Target</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px] text-white/70">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-white/30 font-sans">No audit events logged.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-purple-300">{log.action}</td>
                      <td className="px-4 py-3">{log.actor}</td>
                      <td className="px-4 py-3 font-sans text-white/80">{log.details}</td>
                      <td className="px-4 py-3 text-white/40">{log.ipAddress}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CHATBOT LOGS TAB ── */}
      {activeTab === 'chatlogs' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-purple-400" />
              <h2 className="text-lg font-bold text-white font-sans">Live Chatbot Conversation Feeds</h2>
            </div>
            <button onClick={fetchData} className="text-white/40 hover:text-white transition">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {chatbotLogs.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-8">No chatbot message exchanges found.</p>
            ) : (
              chatbotLogs.map((chat) => (
                <div key={chat.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
                  <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                    <span>Lead Interaction ID: {chat.leadId || 'ANONYMOUS'}</span>
                    <span>{new Date(chat.createdAt).toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="rounded-lg bg-white/5 p-3.5 border border-white/5 text-gold font-sans leading-relaxed">
                      <span className="block text-2xs uppercase tracking-wider font-bold text-white/40 mb-1">User Input:</span>
                      <p>{chat.userMessage}</p>
                    </div>
                    <div className="rounded-lg bg-purple-950/20 p-3.5 border border-purple-500/15 text-purple-200 font-sans leading-relaxed">
                      <span className="block text-2xs uppercase tracking-wider font-bold text-white/40 mb-1">AI Agent Response:</span>
                      <p>{chat.botResponse}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── GLOBAL CONFIGS TAB ── */}
      {activeTab === 'configs' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-purple-400" />
            <h2 className="text-lg font-bold text-white">System Global Configuration Key-Value Editor</h2>
          </div>

          <form onSubmit={saveGlobalConfigs} className="space-y-6 text-left">
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <p className="text-xs text-white/40 leading-relaxed font-sans mb-2">
                Below are the active system configurations. Modify these keys to update default behaviors, limits, or configurations across all instances.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Dynamically render text inputs for configs */}
                {Object.keys(globalConfigs).length === 0 ? (
                  <p className="text-xs text-white/30">No active key-value properties found in system.</p>
                ) : (
                  Object.keys(globalConfigs).map((key) => {
                    // Check if value is object or array; skip if complex or stringify
                    const val = typeof globalConfigs[key] === 'object' 
                      ? JSON.stringify(globalConfigs[key]) 
                      : globalConfigs[key];
                    
                    return (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-purple-300 tracking-wider uppercase font-mono">{key}</label>
                        <input
                          type="text"
                          value={val || ''}
                          onChange={(e) => {
                            let parsedVal: any = e.target.value;
                            if (typeof globalConfigs[key] === 'number') {
                              parsedVal = Number(e.target.value);
                            }
                            setGlobalConfigs({ ...globalConfigs, [key]: parsedVal });
                          }}
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition font-mono"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {configStatus && (
              <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/20 px-4 py-3 text-xs text-purple-300 animate-pulse">
                <AlertCircle size={14} className="text-purple-400" />
                <span>{configStatus}</span>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-6 py-3.5 text-xs font-bold transition"
            >
              <Save size={14} />
              <span>Update Global Configuration Parameters</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
