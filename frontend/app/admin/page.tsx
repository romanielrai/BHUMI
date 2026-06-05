'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, PhoneCall, CalendarDays, RefreshCw, Settings, BookOpen, 
  ShieldCheck, BarChart3, LogOut, X, Plus, Trash2, Check, ArrowLeft 
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  status: string;
  source: string;
  createdAt: string;
}

interface MetricData {
  totalLeads: number;
  appointmentsBooked: number;
  callsAnswered: number;
}

const adminActions = [
  { id: 'manage-clients', icon: <Users className="h-5 w-5 text-gold" />, title: 'Manage Clients', desc: 'View, add, or suspend client accounts.' },
  { id: 'view-analytics', icon: <BarChart3 className="h-5 w-5 text-gold" />, title: 'View Analytics', desc: 'Revenue, calls, and campaign performance.' },
  { id: 'review-leads', icon: <PhoneCall className="h-5 w-5 text-gold" />, title: 'Review Leads', desc: 'Incoming leads from all channels.' },
  { id: 'approve-appointments', icon: <CalendarDays className="h-5 w-5 text-gold" />, title: 'Approve Appointments', desc: 'Confirm scheduled consultations.' },
  { id: 'train-chatbot', icon: <BookOpen className="h-5 w-5 text-gold" />, title: 'Train Chatbot', desc: 'Add knowledge base entries and scripts.' },
  { id: 'adjust-scripts', icon: <Settings className="h-5 w-5 text-gold" />, title: 'Adjust AI Scripts', desc: 'Update voice agent call scripts.' },
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricData | null>(null);

  // Active module modal ID
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Data states for modules
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Custom chatbot training context
  const [kbEntries, setKbEntries] = useState<{ q: string; a: string }[]>([
    { q: 'What is the setup time?', a: 'AI receptionist setup is live within 48 hours.' },
    { q: 'Is there a contract?', a: 'All packages are month-to-month with no long-term contract.' }
  ]);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  
  // Custom call scripts
  const [voiceScript, setVoiceScript] = useState(
    'Hello, thanks for calling AI Growth Systems. My name is Sarah, and I am an AI consultant. Are you looking to recover missed calls or automate customer inquiries?'
  );

  // Forms
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', plan: 'GROWTH' });

  const fetchDashboardData = useCallback(async (token: string) => {
    try {
      const metricsResponse = await fetch('/api/dashboard/admin', {
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

  const fetchLeads = useCallback(async (token: string) => {
    setLeadsLoading(true);
    try {
      const res = await fetch('/api/leads?clientId=client-default', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);
      }
    } catch {
      // silently fail — leads table will just be empty
    } finally {
      setLeadsLoading(false);
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
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        setAuthorized(true);
        if (role === 'SUPERADMIN') setIsSuperAdmin(true);
        fetchLeads(token);
        fetchDashboardData(token);
      } else {
        router.push('/login');
        return;
      }
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, fetchLeads, fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const refreshData = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchLeads(token);
      fetchDashboardData(token);
    }
  };

  // --- Fetch Module Specific Data ---
  const loadModuleData = async (moduleId: string) => {
    const token = localStorage.getItem('token') || '';
    if (!token) return;

    if (moduleId === 'manage-clients') {
      try {
        const res = await fetch('/api/admin/clients', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setClientsList(data.clients || []);
        }
      } catch (e) { console.error(e); }
    } else if (moduleId === 'approve-appointments') {
      try {
        const res = await fetch('/api/admin/appointments', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setAppointments(data.appointments || []);
        }
      } catch (e) { console.error(e); }
    }
  };

  const openAction = (moduleId: string) => {
    setActiveModal(moduleId);
    loadModuleData(moduleId);
  };

  const closeAction = () => {
    setActiveModal(null);
  };

  // --- Actions ---

  // Update Lead Status
  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchLeads(token);
        fetchDashboardData(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead record?')) return;
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchLeads(token);
        fetchDashboardData(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Client Action
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        setShowAddClientModal(false);
        setNewClient({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', plan: 'GROWTH' });
        loadModuleData('manage-clients');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add client');
      }
    } catch (err) {
      alert('Network error adding client');
    }
  };

  // Approve/Confirm Appointment
  const handleConfirmAppointment = async (apptId: string, newStatus: string) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/admin/appointments/${apptId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadModuleData('approve-appointments');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12 text-center text-white">
        <div className="rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow">
          <p className="animate-pulse text-lg">Verifying administrative access...</p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="mx-auto mt-28 max-w-md px-6 pb-24">
        <section className="rounded-[32px] border border-red-500/20 bg-red-950/10 p-10 text-center shadow-glow">
          <ShieldCheck className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <p className="text-sm uppercase tracking-[0.3em] text-red-400">Access Denied</p>
          <h1 className="mt-4 text-2xl font-semibold text-white">Forbidden</h1>
          <p className="mt-4 text-foreground/80 leading-relaxed">
            You do not have administrative privileges to access this area.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-block rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-background transition hover:brightness-95"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const systemStats = [
    { label: 'Total Leads (All Clients)', value: metrics?.totalLeads ?? '...' },
    { label: 'Appointments Booked', value: metrics?.appointmentsBooked ?? '...' },
    { label: 'Total Calls Answered', value: metrics?.callsAnswered ?? '...' },
  ];

  return (
    <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12">
      <div className="rounded-[32px] border border-white/10 bg-glass p-8 md:p-10 shadow-glow">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold mb-3">
              <ShieldCheck size={12} /> Admin Control Center
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white">Client, lead & analytics management.</h1>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={refreshData}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground transition hover:bg-white/10 hover:text-gold"
            >
              <RefreshCw size={15} className={leadsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            {isSuperAdmin && (
              <Link
                href="/superadmin"
                className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm text-purple-400 transition hover:bg-purple-500/20"
              >
                <ShieldCheck size={15} />
                Superadmin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-red-950/20 border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-900/30 transition shadow-sm"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          {systemStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-gold/10 bg-[#08122e] p-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-foreground/60">{stat.label}</p>
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {adminActions.map((action) => (
            <div
              key={action.id}
              onClick={() => openAction(action.id)}
              className="group rounded-3xl border border-white/10 bg-[#08122e] p-5 transition hover:border-gold/20 hover:bg-[#0a1535] cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gold/10 p-3 mt-0.5 group-hover:bg-gold/20 transition">{action.icon}</div>
                <div>
                  <p className="font-semibold text-white text-sm">{action.title}</p>
                  <p className="mt-1 text-xs text-foreground/60 leading-relaxed">{action.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leads Table */}
        <div className="rounded-[28px] border border-white/10 bg-[#08122e]/90 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-white">All Inbound Leads</h2>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs text-gold">
              {leads.length} record{leads.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-foreground/80">
              <thead>
                <tr className="border-b border-white/10 text-white/60 font-medium">
                  <th className="pb-4 pt-2 pr-4">Name</th>
                  <th className="pb-4 pt-2 px-4">Contact</th>
                  <th className="pb-4 pt-2 px-4">Business</th>
                  <th className="pb-4 pt-2 px-4">Source</th>
                  <th className="pb-4 pt-2 px-4 text-center">Status</th>
                  <th className="pb-4 pt-2 pl-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {leadsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-white/50 animate-pulse">Loading leads...</td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-white/50">No leads found in database.</td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-4 pr-4 font-semibold text-white">{lead.name}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span>{lead.email}</span>
                          <span className="text-xs text-white/50 mt-0.5">{lead.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">{lead.business}</td>
                      <td className="py-4 px-4">
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/80">{lead.source}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                          className="bg-[#050b1d] border border-white/10 rounded px-2.5 py-1 text-xs text-white font-semibold outline-none"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="RECOVERED">RECOVERED</option>
                        </select>
                      </td>
                      <td className="py-4 pl-4 text-right text-xs text-white/50">
                        {new Date(lead.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL OVERLAYS --- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[32px] border border-white/15 bg-[#050b1d] p-6 md:p-8 shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gold/10 p-2 text-gold">
                  {adminActions.find(a => a.id === activeModal)?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{adminActions.find(a => a.id === activeModal)?.title}</h2>
                  <p className="text-xs text-white/50">{adminActions.find(a => a.id === activeModal)?.desc}</p>
                </div>
              </div>
              <button 
                onClick={closeAction}
                className="rounded-full border border-white/10 p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1">

              {/* 1. MANAGE CLIENTS */}
              {activeModal === 'manage-clients' && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white text-md">Client Accounts</h3>
                    <button
                      onClick={() => setShowAddClientModal(true)}
                      className="inline-flex items-center gap-1 rounded-full bg-gold hover:brightness-95 px-4 py-2 text-xs font-semibold text-background transition"
                    >
                      <Plus size={14} /> Add Client
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
                          <th className="p-3">Company Name</th>
                          <th className="p-3">Contact</th>
                          <th className="p-3">Plan</th>
                          <th className="p-3">Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientsList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-white/50">Loading clients...</td>
                          </tr>
                        ) : (
                          clientsList.map((client) => (
                            <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="p-3 font-semibold text-white">{client.companyName}</td>
                              <td className="p-3 text-white/70">{client.contactName} ({client.contactEmail})</td>
                              <td className="p-3">
                                <span className="rounded bg-gold/10 border border-gold/25 px-2 py-0.5 text-xs text-gold font-bold">
                                  {client.plan}
                                </span>
                              </td>
                              <td className="p-3 text-white/50">{client.contactPhone || 'N/A'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Client Dialog */}
                  {showAddClientModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
                      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#070e24] p-6 shadow-xl text-white">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                          <h4 className="font-semibold text-md">Create Client Account</h4>
                          <button onClick={() => setShowAddClientModal(false)} className="text-white/60 hover:text-white"><X size={15} /></button>
                        </div>
                        <form onSubmit={handleAddClient} className="space-y-4">
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Company Name</label>
                            <input 
                              type="text" 
                              required 
                              value={newClient.companyName} 
                              onChange={(e) => setNewClient({...newClient, companyName: e.target.value})}
                              className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Contact Name</label>
                            <input 
                              type="text" 
                              value={newClient.contactName} 
                              onChange={(e) => setNewClient({...newClient, contactName: e.target.value})}
                              className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Contact Email</label>
                            <input 
                              type="email" 
                              required 
                              value={newClient.contactEmail} 
                              onChange={(e) => setNewClient({...newClient, contactEmail: e.target.value})}
                              className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Contact Phone</label>
                            <input 
                              type="text" 
                              value={newClient.contactPhone} 
                              onChange={(e) => setNewClient({...newClient, contactPhone: e.target.value})}
                              className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Tier Plan</label>
                            <select 
                              value={newClient.plan} 
                              onChange={(e) => setNewClient({...newClient, plan: e.target.value})}
                              className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none"
                            >
                              <option value="STARTER">STARTER ($1,497/mo)</option>
                              <option value="GROWTH">GROWTH ($2,997/mo)</option>
                              <option value="DOMINANCE">DOMINANCE ($5,997/mo)</option>
                            </select>
                          </div>
                          <div className="pt-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowAddClientModal(false)} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/80 hover:bg-white/5">Cancel</button>
                            <button type="submit" className="rounded-full bg-gold text-background px-5 py-2 text-xs font-semibold hover:brightness-95">Save Client</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. VIEW ANALYTICS */}
              {activeModal === 'view-analytics' && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                      <span className="text-xs text-white/50 block">Conversion Rate</span>
                      <span className="text-xl font-semibold mt-1 block">18.7%</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                      <span className="text-xs text-white/50 block">Response Uptime</span>
                      <span className="text-xl font-semibold mt-1 block">99.9%</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                      <span className="text-xs text-white/50 block">Missed Call Leads Recovered</span>
                      <span className="text-xl font-semibold mt-1 block">87.2%</span>
                    </div>
                  </div>

                  {/* HTML Bar Chart representation */}
                  <div className="rounded-2xl border border-white/10 bg-[#08122e] p-6">
                    <h3 className="font-semibold text-white text-sm mb-4">Lead Velocity (Last 5 Days)</h3>
                    <div className="space-y-4">
                      {[
                        { day: 'Monday', count: 18, pct: '60%' },
                        { day: 'Tuesday', count: 24, pct: '80%' },
                        { day: 'Wednesday', count: 30, pct: '100%' },
                        { day: 'Thursday', count: 15, pct: '50%' },
                        { day: 'Friday', count: 21, pct: '70%' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 text-xs">
                          <span className="w-20 text-white/70">{item.day}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                            <div className="bg-gold h-full rounded-full transition-all duration-500" style={{ width: item.pct }} />
                          </div>
                          <span className="w-8 text-right font-bold text-white">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. REVIEW LEADS PANEL */}
              {activeModal === 'review-leads' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-white text-md">Review Leads Console</h3>
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
                          <th className="p-3">Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Business</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="p-3 font-semibold text-white">{lead.name}</td>
                            <td className="p-3 text-white/70">{lead.email}</td>
                            <td className="p-3 text-white/50">{lead.business || 'N/A'}</td>
                            <td className="p-3 text-center">
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                                className="bg-[#050b1d] border border-white/10 rounded px-2 py-0.5 text-xs text-white"
                              >
                                <option value="NEW">NEW</option>
                                <option value="CONTACTED">CONTACTED</option>
                                <option value="RECOVERED">RECOVERED</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="rounded p-1 bg-red-900/10 text-red-400 border border-red-500/20 hover:bg-red-900/20"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. APPROVE APPOINTMENTS */}
              {activeModal === 'approve-appointments' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-white text-md">Customer Booking Approvals</h3>
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
                          <th className="p-3">Title</th>
                          <th className="p-3">Scheduled Time</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Notes</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-white/50">No appointment bookings found.</td>
                          </tr>
                        ) : (
                          appointments.map((appt) => (
                            <tr key={appt.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="p-3 font-semibold text-white">{appt.title}</td>
                              <td className="p-3 text-white/70">
                                {new Date(appt.scheduledAt).toLocaleString(undefined, {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </td>
                              <td className="p-3 text-white/50">{appt.durationMin} mins</td>
                              <td className="p-3 text-white/60 max-w-xs truncate" title={appt.notes}>{appt.notes || 'N/A'}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block rounded-full px-2 py-0.5 text-2xs font-bold border ${
                                  appt.status === 'CONFIRMED' ? 'bg-green-950 text-green-400 border-green-500/20' :
                                  appt.status === 'CANCELLED' ? 'bg-red-950 text-red-400 border-red-500/20' :
                                  'bg-amber-950 text-amber-400 border-amber-500/20'
                                }`}>
                                  {appt.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-1.5">
                                  {appt.status !== 'CONFIRMED' && (
                                    <button
                                      onClick={() => handleConfirmAppointment(appt.id, 'CONFIRMED')}
                                      className="rounded bg-green-950 text-green-400 border border-green-500/20 px-2 py-1 text-2xs hover:bg-green-900/30 transition"
                                    >
                                      Confirm
                                    </button>
                                  )}
                                  {appt.status !== 'CANCELLED' && (
                                    <button
                                      onClick={() => handleConfirmAppointment(appt.id, 'CANCELLED')}
                                      className="rounded bg-red-950 text-red-400 border border-red-500/20 px-2 py-1 text-2xs hover:bg-red-900/30 transition"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. TRAIN CHATBOT */}
              {activeModal === 'train-chatbot' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h4 className="font-semibold text-white text-sm mb-3">Add Custom Knowledge Base Q&A</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-2xs text-white/50 mb-1">User Inquiry Question</label>
                        <input
                          type="text"
                          value={newQ}
                          onChange={(e) => setNewQ(e.target.value)}
                          placeholder="e.g. Do you support API connections?"
                          className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-2xs text-white/50 mb-1">AI Agent Response Answer</label>
                        <textarea
                          rows={2}
                          value={newA}
                          onChange={(e) => setNewA(e.target.value)}
                          placeholder="e.g. Yes, we integrate with GoHighLevel, HubSpot, Salesforce, and direct webhooks."
                          className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-gold outline-none"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!newQ || !newA) return;
                          setKbEntries([...kbEntries, { q: newQ, a: newA }]);
                          setNewQ('');
                          setNewA('');
                        }}
                        className="rounded-full bg-gold text-background px-4 py-2 text-xs font-semibold hover:brightness-95 transition"
                      >
                        Add to Knowledge Base
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-white text-sm">Active Training Directory</h4>
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                      {kbEntries.map((entry, idx) => (
                        <div key={idx} className="rounded-xl border border-white/5 bg-white/5 p-3">
                          <p className="text-xs font-bold text-gold">Q: {entry.q}</p>
                          <p className="text-xs text-white/70 mt-1">A: {entry.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. ADJUST AI SCRIPTS */}
              {activeModal === 'adjust-scripts' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-2">Voice Call Initial Pitch & Response Script</label>
                    <textarea
                      rows={6}
                      value={voiceScript}
                      onChange={(e) => setVoiceScript(e.target.value)}
                      className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 focus:border-gold outline-none font-mono"
                    />
                  </div>
                  <button
                    onClick={() => {
                      alert('AI Script prompt template updated successfully in simulation cache.');
                      closeAction();
                    }}
                    className="rounded-full bg-gold text-background px-5 py-2.5 text-xs font-semibold hover:brightness-95 transition"
                  >
                    Save Voice Scripts
                  </button>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-white/10 pt-4 mt-6">
              <button 
                onClick={closeAction}
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
