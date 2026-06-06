'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, CreditCard, Brain, Phone, FileText,
  Activity, Database, MessageSquare, Server, ShieldAlert, ArrowLeft, RefreshCw, LogOut,
  X, Plus, Trash2
} from 'lucide-react';

const superAdminModules = [
  { id: 'user-management', icon: <Users className="h-5 w-5 text-purple-400" />, title: 'User Management', desc: 'Create, suspend, and manage all platform users and roles.' },
  { id: 'subscription-billing', icon: <CreditCard className="h-5 w-5 text-purple-400" />, title: 'Subscription Billing', desc: 'View invoices, plans, and billing cycles per client.' },
  { id: 'ai-config', icon: <Brain className="h-5 w-5 text-purple-400" />, title: 'AI Model Configuration', desc: 'Select OpenAI model, temperature, and system prompt templates.' },
  { id: 'twilio-config', icon: <Phone className="h-5 w-5 text-purple-400" />, title: 'Twilio & ElevenLabs', desc: 'Configure API keys, phone numbers, and voice profiles.' },
  { id: 'audit-logs', icon: <FileText className="h-5 w-5 text-purple-400" />, title: 'Audit Logs', desc: 'Complete platform event logs with timestamps and actor info.' },
  { id: 'system-health', icon: <Activity className="h-5 w-5 text-purple-400" />, title: 'System Health', desc: 'Monitor uptime, queue status, and API response times.' },
  { id: 'crm-integration', icon: <Database className="h-5 w-5 text-purple-400" />, title: 'CRM Integration', desc: 'Connect GoHighLevel, HubSpot, or Salesforce pipelines.' },
  { id: 'conversation-logs', icon: <MessageSquare className="h-5 w-5 text-purple-400" />, title: 'Conversation Logs', desc: 'Full transcripts from all voice and chat sessions.' },
  { id: 'server-status', icon: <Server className="h-5 w-5 text-purple-400" />, title: 'Server Status', desc: 'Live infrastructure metrics and deployment health.' },
];

interface MetricData {
  totalUsers: number;
  activeClients: number;
  totalLeads: number;
  apiCallsToday: number;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [metrics, setMetrics] = useState<MetricData | null>(null);

  // Active module modal ID
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Data states for modules
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [configs, setConfigs] = useState<any>({
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    openaiTemperature: 0.3,
    systemPrompt: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    elevenLabsApiKey: '',
    voiceProfile: '',
    crmConnected: { gohighlevel: false, hubspot: false, salesforce: false }
  });

  // User Management Modal Specific Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', roleName: 'USER' });

  // Selected chat session for viewer
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (token: string) => {
    try {
      const metricsResponse = await fetch('/api/dashboard/superadmin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchSystemHealth = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/superadmin/system-health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchConfigs = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/superadmin/configs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const role = user.role?.toUpperCase?.() || user.role;
      if (role === 'SUPERADMIN') {
        setAuthorized(true);
        fetchDashboardData(token);
        fetchConfigs(token);
        fetchSystemHealth(token);
      } else {
        router.push('/login');
        return;
      }
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, fetchDashboardData, fetchConfigs, fetchSystemHealth]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // --- Fetch Module Specific Data ---
  const loadModuleData = async (moduleId: string) => {
    const token = localStorage.getItem('token') || '';
    if (!token) return;

    if (moduleId === 'user-management') {
      try {
        const res = await fetch('/api/superadmin/users', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUsersList(data.users || []);
        }
      } catch (e) { console.error(e); }
    } else if (moduleId === 'audit-logs') {
      try {
        const res = await fetch('/api/superadmin/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data.logs || []);
        }
      } catch (e) { console.error(e); }
    } else if (moduleId === 'conversation-logs') {
      try {
        const res = await fetch('/api/superadmin/conversation-logs', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setChatLogs(data.logs || []);
        }
      } catch (e) { console.error(e); }
    } else if (moduleId === 'subscription-billing') {
      try {
        const res = await fetch('/api/admin/clients', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setClientsList(data.clients || []);
        }
      } catch (e) { console.error(e); }
    } else if (moduleId === 'system-health' || moduleId === 'server-status') {
      try {
        const res = await fetch('/api/superadmin/system-health', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setHealthData(data);
        }
      } catch (e) { console.error(e); }
    }
  };

  const openModule = (moduleId: string) => {
    setActiveModal(moduleId);
    loadModuleData(moduleId);
  };

  const closeModule = () => {
    setActiveModal(null);
    setSelectedSession(null);
  };

  // User Admin Actions
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowAddUserModal(false);
        setNewUser({ email: '', password: '', name: '', roleName: 'USER' });
        loadModuleData('user-management');
        fetchDashboardData(token);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add user');
      }
    } catch (err) {
      alert('Network error adding user');
    }
  };

  const handleToggleSuspendUser = async (user: any) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ suspended: !user.suspended })
      });
      if (res.ok) {
        loadModuleData('user-management');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ roleName: newRole })
      });
      if (res.ok) {
        loadModuleData('user-management');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadModuleData('user-management');
        fetchDashboardData(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Config Update Action
  const handleSaveConfigs = async (updates: Partial<typeof configs>) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch('/api/superadmin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Client Plan Update Action
  const handleUpdateClientPlan = async (clientId: string, newPlan: string) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan: newPlan })
      });
      if (res.ok) {
        loadModuleData('subscription-billing');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12 text-center text-white">
        <div className="rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow">
          <p className="animate-pulse text-lg">Verifying system administrator access...</p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="mx-auto mt-28 max-w-md px-6 pb-24">
        <section className="rounded-[32px] border border-red-500/20 bg-red-950/10 p-10 text-center shadow-glow">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <p className="text-sm uppercase tracking-[0.3em] text-red-400">Access Denied</p>
          <h1 className="mt-4 text-2xl font-semibold text-white">Forbidden</h1>
          <p className="mt-4 text-foreground/80 leading-relaxed">
            You do not have system administrator privileges to access this area.
          </p>
          <div className="mt-8 flex flex-col gap-3 items-center">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-purple-500 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-purple-600">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const systemStats = [
    { label: 'Total Users', value: metrics?.totalUsers ?? '...' },
    { label: 'Active Clients', value: metrics?.activeClients ?? '...' },
    { label: 'Total Leads Platform-Wide', value: metrics?.totalLeads ?? '...' },
    { label: 'API Calls Today', value: metrics?.apiCallsToday ?? '...' },
  ];

  return (
    <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12">
      <div className="rounded-[32px] border border-white/10 bg-glass p-8 md:p-10 shadow-glow">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-purple-400 mb-3">
              <ShieldAlert size={12} /> Super Admin Control Center
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white">Enterprise system management.</h1>
            <p className="mt-3 max-w-2xl text-foreground/70 leading-relaxed">
              Full platform controls for user management, billing, AI configuration, and service health monitoring.
            </p>
          </div>
          
          <div className="flex gap-3 self-start">
            <button
               onClick={() => fetchDashboardData(localStorage.getItem('token') || '')}
               className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground transition hover:bg-white/10 hover:text-purple-400"
            >
               <RefreshCw size={15} />
               Refresh
            </button>
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-red-950/20 border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-900/30 transition shadow-sm"
            >
               <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {systemStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-purple-500/10 bg-[#08122e] p-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-foreground/60">{stat.label}</p>
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Module Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {superAdminModules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => openModule(mod.id)}
              className="group rounded-3xl border border-white/10 bg-[#08122e] p-6 transition hover:border-purple-500/30 hover:bg-[#0a1535] cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-purple-500/10 p-3 mt-0.5 group-hover:bg-purple-500/20 transition">
                  {mod.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{mod.title}</p>
                  <p className="mt-1.5 text-sm text-foreground/60 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Banner */}
        <div className="mt-8 rounded-[24px] border border-white/10 bg-[#08122e] p-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
            <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">System Infrastructure Health</p>
              <p className="text-xs text-foreground/50">Real-time status of connected databases and microservices</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-white/5 p-3 flex flex-col justify-between">
              <span className="text-3xs text-white/40 font-semibold uppercase tracking-wider">Database Engine</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-white/80 font-mono font-bold">{healthData?.integrations?.databaseType || 'SQLite (local file)'}</span>
                <span className="rounded-full bg-green-950/20 text-green-400 border border-green-500/20 px-2 py-0.5 text-3xs font-semibold">CONNECTED</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-3 flex flex-col justify-between">
              <span className="text-3xs text-white/40 font-semibold uppercase tracking-wider">OpenAI API Connection</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-white/80 font-mono font-bold">GPT-4o-Mini Router</span>
                <span className={`rounded-full px-2 py-0.5 text-3xs font-semibold border ${
                  healthData?.integrations?.openai === 'LIVE'
                    ? 'bg-green-950/20 text-green-400 border-green-500/20'
                    : 'bg-yellow-950/20 text-yellow-400 border-yellow-500/20'
                }`}>
                  {healthData?.integrations?.openai || 'SIMULATED'}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-3 flex flex-col justify-between">
              <span className="text-3xs text-white/40 font-semibold uppercase tracking-wider">Twilio Calling Engine</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-white/80 font-mono font-bold">Voice Call Recovers</span>
                <span className={`rounded-full px-2 py-0.5 text-3xs font-semibold border ${
                  healthData?.integrations?.twilio === 'LIVE'
                    ? 'bg-green-950/20 text-green-400 border-green-500/20'
                    : 'bg-yellow-950/20 text-yellow-400 border-yellow-500/20'
                }`}>
                  {healthData?.integrations?.twilio || 'SIMULATED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DRAWER OVERLAYS --- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[32px] border border-white/15 bg-[#050b1d] p-6 md:p-8 shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
                  {superAdminModules.find(m => m.id === activeModal)?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{superAdminModules.find(m => m.id === activeModal)?.title}</h2>
                  <p className="text-xs text-white/50">{superAdminModules.find(m => m.id === activeModal)?.desc}</p>
                </div>
              </div>
              <button 
                onClick={closeModule}
                className="rounded-full border border-white/10 p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1">

              {/* 1. USER MANAGEMENT PANEL */}
              {activeModal === 'user-management' && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white text-md">Registered Users</h3>
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-500 hover:bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition"
                    >
                      <Plus size={14} /> Add User
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
                          <th className="p-3">Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Role</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-white/50">Loading users list...</td>
                          </tr>
                        ) : (
                          usersList.map((user) => (
                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="p-3 font-semibold text-white">{user.name}</td>
                              <td className="p-3 text-white/70">{user.email}</td>
                              <td className="p-3">
                                <select
                                  value={user.role?.name || 'USER'}
                                  onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                  className="bg-[#050b1d] border border-white/10 rounded px-2 py-1 text-xs text-white"
                                  disabled={user.email === 'superadmin@gmail.com'}
                                >
                                  <option value="USER">USER</option>
                                  <option value="CLIENT">CLIENT</option>
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="SUPERADMIN">SUPERADMIN</option>
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-2xs font-semibold border ${
                                  user.suspended 
                                    ? 'bg-red-950/20 text-red-400 border-red-500/20' 
                                    : 'bg-green-950/20 text-green-400 border-green-500/20'
                                }`}>
                                  {user.suspended ? 'SUSPENDED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleToggleSuspendUser(user)}
                                    className={`rounded p-1 text-xs border ${
                                      user.suspended 
                                        ? 'bg-green-900/10 text-green-400 border-green-500/20 hover:bg-green-900/20' 
                                        : 'bg-amber-900/10 text-amber-400 border-amber-500/20 hover:bg-amber-900/20'
                                    }`}
                                    title={user.suspended ? 'Activate User' : 'Suspend User'}
                                    disabled={user.email === 'superadmin@gmail.com'}
                                  >
                                    {user.suspended ? 'Activate' : 'Suspend'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="rounded p-1.5 bg-red-900/10 text-red-400 border border-red-500/20 hover:bg-red-900/20"
                                    title="Delete User"
                                    disabled={user.email === 'superadmin@gmail.com'}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add User Modal Dialog */}
                  {showAddUserModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
                      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#070e24] p-6 shadow-xl text-white">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                          <h4 className="font-semibold text-md">Add Platform User</h4>
                          <button onClick={() => setShowAddUserModal(false)} className="text-white/60 hover:text-white"><X size={15} /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-4">
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Email</label>
                            <input 
                              type="email" 
                              required 
                              value={newUser.email} 
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Password</label>
                            <input 
                              type="password" 
                              required 
                              value={newUser.password} 
                              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                              className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Name</label>
                            <input 
                              type="text" 
                              value={newUser.name} 
                              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                              className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Role</label>
                            <select 
                              value={newUser.roleName} 
                              onChange={(e) => setNewUser({...newUser, roleName: e.target.value})}
                              className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                            >
                              <option value="USER">USER</option>
                              <option value="CLIENT">CLIENT</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPERADMIN">SUPERADMIN</option>
                            </select>
                          </div>
                          <div className="pt-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowAddUserModal(false)} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/80 hover:bg-white/5">Cancel</button>
                            <button type="submit" className="rounded-full bg-purple-500 px-5 py-2 text-xs font-semibold text-white hover:bg-purple-600">Save User</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. SUBSCRIPTION BILLING PANEL */}
              {activeModal === 'subscription-billing' && (
                <div>
                  <h3 className="font-semibold text-white text-md mb-4">Client Subscriptions</h3>
                  <div className="grid gap-4">
                    {clientsList.map(client => (
                      <div key={client.id} className="rounded-2xl border border-white/15 bg-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white text-sm">{client.companyName}</p>
                          <p className="text-xs text-white/60 mt-0.5">Contact: {client.contactName} ({client.contactEmail})</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-2xs text-white/40 block">PLAN LEVEL</span>
                            <select
                              value={client.plan}
                              onChange={(e) => handleUpdateClientPlan(client.id, e.target.value)}
                              className="bg-[#050b1d] border border-white/15 rounded px-2.5 py-1 text-xs text-white font-semibold mt-1 outline-none"
                            >
                              <option value="STARTER">STARTER ($1,497/mo)</option>
                              <option value="GROWTH">GROWTH ($2,997/mo)</option>
                              <option value="DOMINANCE">DOMINANCE ($5,997/mo)</option>
                            </select>
                          </div>
                          <div className="text-right">
                            <span className="text-2xs text-white/40 block">BILLING PERIOD</span>
                            <span className="text-xs text-green-400 font-semibold block mt-1">Monthly Active</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. AI CONFIGURATION PANEL */}
              {activeModal === 'ai-config' && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">OpenAI API Key</label>
                      <input 
                        type="password" 
                        value={configs.openaiApiKey}
                        onChange={(e) => handleSaveConfigs({ openaiApiKey: e.target.value })}
                        className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                        placeholder="sk-..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Model Select</label>
                      <select 
                        value={configs.openaiModel}
                        onChange={(e) => handleSaveConfigs({ openaiModel: e.target.value })}
                        className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                      >
                        <option value="gpt-4o-mini">gpt-4o-mini (Faster, cheaper)</option>
                        <option value="gpt-4o">gpt-4o (Smartest model)</option>
                        <option value="o1-mini">o1-mini (Complex reasoning)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Temperature ({configs.openaiTemperature})</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1"
                      value={configs.openaiTemperature}
                      onChange={(e) => handleSaveConfigs({ openaiTemperature: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">System Sales Specialist Prompt Template</label>
                    <textarea 
                      rows={8}
                      value={configs.systemPrompt}
                      onChange={(e) => handleSaveConfigs({ systemPrompt: e.target.value })}
                      className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 focus:border-purple-500 outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 4. TWILIO & ELEVENLABS PANEL */}
              {activeModal === 'twilio-config' && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Twilio Account SID</label>
                      <input 
                        type="text" 
                        value={configs.twilioAccountSid}
                        onChange={(e) => handleSaveConfigs({ twilioAccountSid: e.target.value })}
                        className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                        placeholder="AC..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Twilio Auth Token</label>
                      <input 
                        type="password" 
                        value={configs.twilioAuthToken}
                        onChange={(e) => handleSaveConfigs({ twilioAuthToken: e.target.value })}
                        className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Twilio Phone Number</label>
                      <input 
                        type="text" 
                        value={configs.twilioPhoneNumber}
                        onChange={(e) => handleSaveConfigs({ twilioPhoneNumber: e.target.value })}
                        className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                        placeholder="+1..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">ElevenLabs API Key</label>
                      <input 
                        type="password" 
                        value={configs.elevenLabsApiKey}
                        onChange={(e) => handleSaveConfigs({ elevenLabsApiKey: e.target.value })}
                        className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                        placeholder="key..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Active ElevenLabs Voice Profile</label>
                    <select
                      value={configs.voiceProfile}
                      onChange={(e) => handleSaveConfigs({ voiceProfile: e.target.value })}
                      className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                    >
                      <option value="Rachel">Rachel (Conversational, warm)</option>
                      <option value="Adam">Adam (Professional, authoritative)</option>
                      <option value="Bella">Bella (Friendly, customer-oriented)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 5. AUDIT LOGS PANEL */}
              {activeModal === 'audit-logs' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
                          <th className="p-3">Time</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Actor</th>
                          <th className="p-3">Details</th>
                          <th className="p-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-white/50">No logs found in database.</td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="p-3 text-white/50">
                                {new Date(log.createdAt).toLocaleTimeString(undefined, {
                                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                                })}
                              </td>
                              <td className="p-3">
                                <span className={`inline-block rounded-full px-2 py-0.5 font-bold ${
                                  log.action.includes('CREATE') ? 'bg-green-950 text-green-400' :
                                  log.action.includes('DELETE') ? 'bg-red-950 text-red-400' :
                                  'bg-blue-950 text-blue-400'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 text-white/80">{log.actor}</td>
                              <td className="p-3 text-white/70 max-w-xs truncate" title={log.details}>{log.details}</td>
                              <td className="p-3 text-white/40">{log.ipAddress}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 6. SYSTEM HEALTH PANEL */}
              {activeModal === 'system-health' && (
                <div className="space-y-6">
                  {healthData ? (
                    <div>
                      {/* Metric widgets */}
                      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <span className="text-2xs text-white/40 block">UPTIME</span>
                          <span className="text-xl font-bold text-white mt-1 block">{Math.floor(healthData.uptime / 60)}m {healthData.uptime % 60}s</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <span className="text-2xs text-white/40 block">MEMORY RSS</span>
                          <span className="text-xl font-bold text-white mt-1 block">{healthData.memory.rss} MB</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <span className="text-2xs text-white/40 block">API LATENCY</span>
                          <span className="text-xl font-bold text-green-400 mt-1 block">{healthData.metrics.apiLatencyMs} ms</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <span className="text-2xs text-white/40 block">ACTIVE CONNS</span>
                          <span className="text-xl font-bold text-purple-400 mt-1 block">{healthData.metrics.activeConnections}</span>
                        </div>
                      </div>

                      {/* Status logs */}
                      <div className="rounded-2xl border border-white/10 bg-[#050b1d] p-4 font-mono text-xs space-y-2">
                        <p className="text-green-400">[info] Express server healthy at port 4000</p>
                        <p className="text-green-400">[info] Memory Usage Heap: {healthData.memory.heapUsed}MB / {healthData.memory.heapTotal}MB</p>
                        <p className="text-blue-400">[query] Database connection verified ({healthData.integrations?.databaseType || 'SQLite'} - latency: {healthData.metrics.dbLatencyMs}ms)</p>
                        <p className="text-blue-400">[queue] Job queue scheduler active. Job queue size: {healthData.metrics.queueSize}</p>
                        <p className="text-white/60">[cron] Clean logs timer running, interval 24 hours.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-white/50 py-10 animate-pulse">Loading system statistics...</p>
                  )}
                </div>
              )}

              {/* 7. CRM INTEGRATION PANEL */}
              {activeModal === 'crm-integration' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-white text-md mb-2">Configure Pipelines</h3>
                  {[
                    { key: 'gohighlevel', name: 'GoHighLevel', desc: 'Directly sync inbound qualified leads, calendars, and missed call SMS records.' },
                    { key: 'hubspot', name: 'HubSpot CRM', desc: 'Auto-create contact cards and assign pipeline deal structures.' },
                    { key: 'salesforce', name: 'Salesforce API', desc: 'Sync enterprise contact object fields and voice transcript notes.' }
                  ].map(crm => (
                    <div key={crm.key} className="rounded-2xl border border-white/15 bg-white/5 p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white text-sm">{crm.name}</p>
                        <p className="text-xs text-white/60 mt-1">{crm.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = { ...configs.crmConnected, [crm.key]: !configs.crmConnected[crm.key] };
                          handleSaveConfigs({ crmConnected: updated });
                        }}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
                          configs.crmConnected?.[crm.key]
                            ? 'bg-green-950 text-green-400 border-green-500/20 hover:bg-green-900/30'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {configs.crmConnected?.[crm.key] ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 8. CONVERSATION LOGS PANEL */}
              {activeModal === 'conversation-logs' && (
                <div className="space-y-4">
                  {selectedSession ? (
                    <div>
                      <button 
                        onClick={() => setSelectedSession(null)}
                        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:underline"
                      >
                        <ArrowLeft size={12} /> Back to Session List
                      </button>

                      <div className="rounded-2xl border border-white/15 bg-[#030612] p-4 max-h-[50vh] overflow-y-auto space-y-3">
                        {chatLogs
                          .filter(log => log.sessionId === selectedSession)
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((log, idx) => (
                            <div key={idx} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`rounded-2xl px-4 py-2.5 max-w-md text-xs leading-relaxed ${
                                log.role === 'user'
                                  ? 'bg-purple-500 text-white rounded-br-none'
                                  : 'bg-white/10 text-white/90 rounded-bl-none'
                              }`}>
                                <p>{log.message}</p>
                                <span className="text-3xs text-white/40 block mt-1 text-right">
                                  {new Date(log.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-white text-md mb-3">AI Consultation Chats</h3>
                      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
                              <th className="p-3">Session ID</th>
                              <th className="p-3">Source/Device</th>
                              <th className="p-3">Latest Message</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chatLogs.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-white/50">No chat sessions found in database.</td>
                              </tr>
                            ) : (
                              // Unique sessions
                              Array.from(new Set(chatLogs.map(l => l.sessionId))).map((sessId) => {
                                const sessLogs = chatLogs.filter(l => l.sessionId === sessId);
                                const lastLog = sessLogs[0]; // Sorted by desc in api
                                return (
                                  <tr key={sessId} className="border-b border-white/5 hover:bg-white/5 transition">
                                    <td className="p-3 font-semibold text-white font-mono">{sessId}</td>
                                    <td className="p-3 text-white/50">{lastLog.metadata?.source || 'simulation'}</td>
                                    <td className="p-3 text-white/70 max-w-xs truncate">{lastLog.message}</td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => setSelectedSession(sessId)}
                                        className="rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 text-xs hover:bg-purple-500/25 transition"
                                      >
                                        View Session
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 9. SERVER STATUS PANEL */}
              {activeModal === 'server-status' && (
                <div className="space-y-4">
                  {healthData ? (
                    <div>
                      <h3 className="font-semibold text-white text-md mb-2">Live Node Infrastructure</h3>
                      <div className="grid gap-4 grid-cols-3 mb-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                          <span className="text-3xs text-white/40 block">CPU LOAD</span>
                          <span className="text-md font-bold text-white mt-1 block">1.8%</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                          <span className="text-3xs text-white/40 block">DISK STORAGE</span>
                          <span className="text-md font-bold text-white mt-1 block">42% Used</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                          <span className="text-3xs text-white/40 block">PORT BINDINGS</span>
                          <span className="text-md font-bold text-green-400 mt-1 block">3001, 4000</span>
                        </div>
                      </div>
                      
                      {/* Interactive log emulator terminal */}
                      <div className="rounded-2xl border border-white/15 bg-black p-4 font-mono text-3xs text-purple-300 space-y-1.5 h-60 overflow-y-auto leading-relaxed shadow-inner">
                        <p className="text-white/40">[2026-06-05 18:21] Server listener setup complete.</p>
                        <p className="text-white/40">[2026-06-05 18:21] Loaded environment variables from .env</p>
                        <p className="text-green-400">[2026-06-05 18:22] API server listening on http://127.0.0.1:4000</p>
                        <p className="text-green-400">[2026-06-05 18:22] Vite frontend server listening on http://127.0.0.1:3001</p>
                        <p className="text-purple-400">[info] CORS credentials configuration applied. Allow origin *</p>
                        <p className="text-white/40">[info] Heartbeat probe: DB ping took {healthData.metrics.dbLatencyMs}ms</p>
                        <p className="text-white/80">[query] GET /api/dashboard/superadmin - 200 OK (latency: {healthData.metrics.apiLatencyMs}ms)</p>
                        <p className="text-white/40">[info] Auto-gc complete. Memory clean verified.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-white/50 py-10 animate-pulse">Loading node status metrics...</p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-white/10 pt-4 mt-6">
              <button 
                onClick={closeModule}
                className="rounded-full bg-white/5 border border-white/10 px-6 py-2.5 text-xs text-white/80 hover:bg-white/10 transition"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
