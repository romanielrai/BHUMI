'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, PhoneCall, Settings, Database,
  TrendingUp, RefreshCw, Plus, Edit2, Trash2, Check, X,
  Save, Volume2, ShieldCheck, AlertCircle, Play, Download,
  ChevronRight, BarChart2
} from 'lucide-react';

interface Client {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  plan: string;
  status: string;
}

interface Appointment {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  clientName?: string;
  clientPhone?: string;
}

interface Call {
  id: string;
  leadName: string;
  phone: string;
  durationSec: number;
  initiatedBy: string;
  outcome: string;
  createdAt: string;
  coaching: {
    greeting: number;
    compliance: number;
    sentiment: string;
    coachingNotes: string;
    transcript: string;
  };
}

interface Project {
  id: string;
  name: string;
  clientId: string;
  status: string;
  progress: number;
  client?: { companyName: string };
  uploadedFiles?: any[];
}

interface Agent {
  id: string;
  name: string;
  email: string;
  capacity: number;
  activeTasks: number;
  completionRate: number;
  status: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'clients' | 'appointments' | 'calls' | 'configs' | 'campaigns'>('clients');
  const [loading, setLoading] = useState(true);

  // --- State Variables ---
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Config State
  const [kbEntries, setKbEntries] = useState('');
  const [voiceScript, setVoiceScript] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [publisherNote, setPublisherNote] = useState('');
  const [configStatus, setConfigStatus] = useState('');

  // Workload Splits State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [useAutoSplit, setUseAutoSplit] = useState(true);
  const [manualSplits, setManualSplits] = useState<Record<string, number>>({});
  const [distributeStatus, setDistributeStatus] = useState('');

  // Form Modals / Input State
  const [clientForm, setClientForm] = useState({
    id: '',
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'GROWTH',
    status: 'ACTIVE'
  });
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientFormStatus, setClientFormStatus] = useState('');

  // Selected call for transcript popup
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  // --- Fetch API Data ---
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      
      // 1. Fetch Clients
      const clientsRes = await fetch('/api/admin/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }

      // 2. Fetch Appointments
      const apptsRes = await fetch('/api/admin/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (apptsRes.ok) {
        const data = await apptsRes.json();
        setAppointments(data.appointments || []);
      }

      // 3. Fetch Calls
      const callsRes = await fetch('/api/admin/calls', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (callsRes.ok) {
        const data = await callsRes.json();
        setCalls(data.calls || []);
      }

      // 4. Fetch Configs
      const configsRes = await fetch('/api/admin/configs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (configsRes.ok) {
        const data = await configsRes.json();
        setKbEntries(data.kbEntries || '');
        setVoiceScript(data.voiceScript || '');
        setSystemPrompt(data.systemPrompt || '');
        setPublisherNote(data.publisherNote || '');
      }

      // 5. Fetch Projects (Campaigns)
      const projectsRes = await fetch('/api/crm/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
        
        // Auto select first approved project
        const pendingDist = (data.projects || []).find((p: any) => p.status === 'APPROVED');
        if (pendingDist && !selectedProjectId) {
          setSelectedProjectId(pendingDist.id);
        }
      }

      // 6. Fetch active workloads (agents list)
      const workloadRes = await fetch('/api/crm/workload', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (workloadRes.ok) {
        const data = await workloadRes.json();
        const list = data.metrics?.length > 0 ? data.metrics : [
          { id: 'agent-1', name: 'John Connor', email: 'agent@gmail.com', capacity: 1000, activeTasks: 1, completionRate: 92.4, status: 'AVAILABLE' },
          { id: 'agent-2', name: 'Sarah Connor', email: 'sarah@resistance.net', capacity: 1000, activeTasks: 0, completionRate: 95.0, status: 'AVAILABLE' }
        ];
        setAgents(list);
      }

    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup SSE connection
    const sse = new EventSource('/api/crm/stream');
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === 'LEAD_STATUS_UPDATE' || 
          data.type === 'CONNECTED' || 
          data.type === 'NOTIFICATION'
        ) {
          // Hot refetch calls, projects, appointments
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

  // --- Client CRUD Actions ---
  const openAddClientModal = () => {
    setClientForm({
      id: '',
      companyName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      plan: 'GROWTH',
      status: 'ACTIVE'
    });
    setIsEditingClient(false);
    setClientFormStatus('');
    setIsClientModalOpen(true);
  };

  const openEditClientModal = (client: Client) => {
    setClientForm({
      id: client.id,
      companyName: client.companyName,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      plan: client.plan,
      status: client.status
    });
    setIsEditingClient(true);
    setClientFormStatus('');
    setIsClientModalOpen(true);
  };

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setClientFormStatus('Saving account details...');

    try {
      const url = isEditingClient 
        ? `/api/admin/clients/${clientForm.id}` 
        : '/api/admin/clients';
      const method = isEditingClient ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(clientForm)
      });

      if (res.ok) {
        setClientFormStatus('Saved successfully!');
        fetchData();
        setTimeout(() => setIsClientModalOpen(false), 800);
      } else {
        const data = await res.json();
        setClientFormStatus(data.error || 'Failed to save client details.');
      }
    } catch {
      setClientFormStatus('Network error.');
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this client?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete client account.');
      }
    } catch {
      alert('Network error.');
    }
  };

  // --- Appointment Status Change ---
  const updateAppointmentStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to update status.');
      }
    } catch {
      alert('Network error.');
    }
  };

  // --- AI Settings Configuration Save ---
  const saveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setConfigStatus('Updating live agent settings...');

    try {
      const res = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          kbEntries,
          voiceScript,
          systemPrompt,
          publisherNote
        })
      });

      if (res.ok) {
        setConfigStatus('AI Agents updated successfully! Now Live.');
        setTimeout(() => setConfigStatus(''), 4000);
      } else {
        setConfigStatus('Failed to save configurations.');
      }
    } catch {
      setConfigStatus('Network error.');
    }
  };

  // --- Database Campaign Actions ---
  const handleCampaignApproval = async (id: string, approve: boolean) => {
    const token = localStorage.getItem('token');
    const status = approve ? 'APPROVED' : 'REJECTED';
    
    try {
      const res = await fetch(`/api/crm/projects/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeadSplits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Please select an approved campaign for workload splits.');
      return;
    }

    const token = localStorage.getItem('token');
    setDistributeStatus('Splitting workload leads...');

    try {
      let payload: any = { auto: useAutoSplit };
      
      if (!useAutoSplit) {
        const splits = Object.keys(manualSplits).map(agentId => ({
          agentId,
          count: Number(manualSplits[agentId])
        }));
        payload.agentSplits = splits;
      }

      const res = await fetch(`/api/crm/projects/${selectedProjectId}/distribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setDistributeStatus('Workload split successfully allocated!');
        fetchData();
        setManualSplits({});
        setTimeout(() => setDistributeStatus(''), 4000);
      } else {
        const err = await res.json();
        setDistributeStatus(err.error || 'Failed to split workload.');
      }
    } catch {
      setDistributeStatus('Connection error.');
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/50">
        <p className="animate-pulse text-xs uppercase tracking-widest font-bold">Syncing Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ── TABS SELECTOR ── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-5">
        {[
          { id: 'clients', label: 'Client Accounts', icon: Users },
          { id: 'appointments', label: 'Appointments Booked', icon: Calendar },
          { id: 'calls', label: 'AI Voice Coaching', icon: PhoneCall },
          { id: 'configs', label: 'AI Agent Prompts', icon: Settings },
          { id: 'campaigns', label: 'Workloads & Splits', icon: Database }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === t.id 
                  ? 'bg-gold/15 border border-gold/30 text-gold shadow-glow-sm' 
                  : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CLIENT ACCOUNTS TAB ── */}
      {activeTab === 'clients' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gold" />
              <h2 className="text-lg font-bold text-white font-sans">Client Accounts Management</h2>
            </div>
            <button
              onClick={openAddClientModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gold text-background hover:brightness-105 px-5 py-2.5 text-xs font-bold transition"
            >
              <Plus size={14} />
              <span>Add Client Account</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Primary Contact</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-white/30">No client records found.</td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">{c.companyName}</td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="text-white/80">{c.contactName}</p>
                          <p className="text-2xs text-white/40">{c.contactEmail} • {c.contactPhone || 'No phone'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-gold">
                          {c.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          c.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => openEditClientModal(c)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                          title="Edit"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => deleteClient(c.id)}
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

      {/* ── CLIENT MODAL ── */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#060b1b] p-6 space-y-5 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">
                {isEditingClient ? 'Edit Client Details' : 'Create Client Account'}
              </h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveClient} className="space-y-4">
              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Company Name</label>
                <input
                  required
                  type="text"
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  placeholder="e.g. Septic Specialists"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={clientForm.contactName}
                    onChange={(e) => setClientForm({ ...clientForm, contactName: e.target.value })}
                    placeholder="e.g. James Carter"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold transition"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={clientForm.contactPhone}
                    onChange={(e) => setClientForm({ ...clientForm, contactPhone: e.target.value })}
                    placeholder="e.g. +1 555-0100"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Contact Email</label>
                <input
                  required
                  type="email"
                  value={clientForm.contactEmail}
                  onChange={(e) => setClientForm({ ...clientForm, contactEmail: e.target.value })}
                  placeholder="e.g. contact@company.com"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-gold transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Service Plan</label>
                  <select
                    value={clientForm.plan}
                    onChange={(e) => setClientForm({ ...clientForm, plan: e.target.value })}
                    className="w-full rounded-xl bg-background border border-white/10 px-2 py-2 text-xs text-white outline-none focus:border-gold transition"
                  >
                    <option value="BASIC">Basic Pilot</option>
                    <option value="GROWTH">Growth Scale</option>
                    <option value="ENTERPRISE">Enterprise Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Status</label>
                  <select
                    value={clientForm.status}
                    onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}
                    className="w-full rounded-xl bg-background border border-white/10 px-2 py-2 text-xs text-white outline-none focus:border-gold transition"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {clientFormStatus && (
                <p className="text-xs text-gold animate-pulse text-center">{clientFormStatus}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="w-1/2 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 text-xs font-bold text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-gold text-background hover:brightness-105 py-2.5 text-xs font-bold transition"
                >
                  Save Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── APPOINTMENTS TAB ── */}
      {activeTab === 'appointments' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gold" />
              <h2 className="text-lg font-bold text-white">Appointments Booked via AI</h2>
            </div>
            <button onClick={fetchData} className="text-white/40 hover:text-white transition">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Lead / Title</th>
                  <th className="px-4 py-3">Scheduled At</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Confirmation Status Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-white/30">No booked appointments found.</td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">{appt.title}</p>
                          <p className="text-2xs text-white/40">{appt.clientName || 'Lead Phone: ' + appt.clientPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-white/70">
                        {new Date(appt.scheduledAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          appt.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' :
                          appt.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {appt.status !== 'CONFIRMED' && (
                          <button
                            onClick={() => updateAppointmentStatus(appt.id, 'CONFIRMED')}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition"
                            title="Confirm Booked Slot"
                          >
                            <Check size={11} />
                          </button>
                        )}
                        {appt.status !== 'CANCELLED' && (
                          <button
                            onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white transition"
                            title="Cancel Appointment"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AI VOICE COACHING TAB ── */}
      {activeTab === 'calls' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall size={18} className="text-gold" />
              <h2 className="text-lg font-bold text-white">Outbound Call Performance & Auditing</h2>
            </div>
            <button onClick={fetchData} className="text-white/40 hover:text-white transition">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Avg Greeting Score */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
              <span className="text-[9.5px] uppercase font-bold text-white/40 tracking-wider">Avg Greeting Check</span>
              <p className="text-2xl font-bold font-mono mt-2 text-emerald-400">
                {calls.length > 0 ? (calls.reduce((sum, c) => sum + (c.coaching?.greeting || 0), 0) / calls.length).toFixed(1) : '91.2'}%
              </p>
            </div>
            {/* Avg Compliance Score */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
              <span className="text-[9.5px] uppercase font-bold text-white/40 tracking-wider">Avg Compliance check</span>
              <p className="text-2xl font-bold font-mono mt-2 text-gold">
                {calls.length > 0 ? (calls.reduce((sum, c) => sum + (c.coaching?.compliance || 0), 0) / calls.length).toFixed(1) : '86.7'}%
              </p>
            </div>
            {/* Live Success rate */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
              <span className="text-[9.5px] uppercase font-bold text-white/40 tracking-wider">Conversion Ratio</span>
              <p className="text-2xl font-bold font-mono mt-2 text-blue-400">
                {calls.length > 0 ? (calls.filter(c => c.outcome === 'BOOKED').length / calls.length * 100).toFixed(0) : '66'}%
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Lead Caller</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Greeting / Compliance</th>
                  <th className="px-4 py-3">Sentiment</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3 text-right">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-white/30">No calls logs found.</td>
                  </tr>
                ) : (
                  calls.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">{c.leadName}</p>
                          <p className="text-2xs text-white/40">{c.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono">{c.durationSec}s</td>
                      <td className="px-4 py-3.5 font-mono">
                        <span className="text-emerald-400">{c.coaching?.greeting}%</span>
                        <span className="text-white/30 mx-1">/</span>
                        <span className="text-gold">{c.coaching?.compliance}%</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          c.coaching?.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/60'
                        }`}>
                          {c.coaching?.sentiment || 'Neutral'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[9px] font-extrabold uppercase rounded px-1.5 py-0.5 ${
                          c.outcome === 'BOOKED' ? 'bg-emerald-500/20 text-emerald-400' :
                          c.outcome === 'VOICEMAIL' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60'
                        }`}>
                          {c.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedCall(c)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-2xs text-white hover:text-gold transition font-bold"
                        >
                          <Play size={10} />
                          <span>Audit Call</span>
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

      {/* ── CALL DETAILS & TRANSCRIPT DIALOG ── */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#060b1b] p-6 space-y-5 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Call Compliance & Coaching Dashboard</h3>
                <p className="text-2xs text-white/40">Lead: {selectedCall.leadName} • {selectedCall.phone}</p>
              </div>
              <button onClick={() => setSelectedCall(null)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Greeting score</span>
                <p className="text-xl font-bold font-mono mt-1 text-emerald-400">{selectedCall.coaching?.greeting}%</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Script compliance</span>
                <p className="text-xl font-bold font-mono mt-1 text-gold">{selectedCall.coaching?.compliance}%</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Tone sentiment</span>
                <p className="text-xl font-bold font-mono mt-1 text-blue-400">{selectedCall.coaching?.sentiment}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gold uppercase tracking-wider">AI Coaching Analysis</h4>
              <p className="text-xs text-white/70 leading-relaxed bg-white/[0.01] border border-white/5 rounded-xl p-3.5">
                {selectedCall.coaching?.coachingNotes}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gold uppercase tracking-wider">Live Call Audio Transcript</h4>
              <div className="h-[180px] overflow-y-auto rounded-xl bg-black/50 p-4 border border-white/5 text-xs font-mono space-y-2.5 leading-relaxed">
                {selectedCall.coaching?.transcript.split('\n').map((line, idx) => {
                  const parts = line.split(':');
                  const role = parts[0] || '';
                  const text = parts.slice(1).join(':') || '';
                  return (
                    <div key={idx}>
                      <span className={role.includes('[AI]') ? 'text-purple-300' : 'text-gold font-semibold'}>
                        {role}:
                      </span>
                      <span className="text-white/80"> {text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCall(null)}
                className="rounded-xl bg-white/5 hover:bg-white/10 px-6 py-2.5 text-xs font-bold text-white transition"
              >
                Close Audit Page
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── AI AGENT CONFIG TAB ── */}
      {activeTab === 'configs' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-gold" />
            <h2 className="text-lg font-bold text-white">AI Agents Live Config Center</h2>
          </div>

          <form onSubmit={saveConfigs} className="space-y-5 text-left">
            <div>
              <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase block mb-1.5">
                Knowledge Base (FAQs & Business Rules)
              </label>
              <textarea
                rows={5}
                value={kbEntries}
                onChange={(e) => setKbEntries(e.target.value)}
                placeholder="Rule 1: Standard Septic pump outs start at $1497..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-gold transition font-mono leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase block mb-1.5">
                  Voice Agent Greeting Script
                </label>
                <textarea
                  rows={4}
                  value={voiceScript}
                  onChange={(e) => setVoiceScript(e.target.value)}
                  placeholder="Greeting script used when dialing contacts..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-gold transition font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase block mb-1.5">
                  AI Specialist System Prompt
                </label>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Overall system prompt governing agent behavior..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-gold transition font-mono leading-relaxed"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase block mb-1.5">
                Client Workspace Announcement Note
              </label>
              <textarea
                rows={2}
                value={publisherNote}
                onChange={(e) => setPublisherNote(e.target.value)}
                placeholder="Important updates published directly on Client dashboards..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-gold transition font-mono leading-relaxed"
              />
            </div>

            {configStatus && (
              <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-xs text-gold">
                <AlertCircle size={14} className="text-gold" />
                <span>{configStatus}</span>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gold text-background hover:brightness-105 px-6 py-3.5 text-xs font-bold transition"
            >
              <Save size={14} />
              <span>Deploy Configurations Live</span>
            </button>
          </form>
        </div>
      )}

      {/* ── WORKLOADS & SPLITS TAB ── */}
      {activeTab === 'campaigns' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 text-left">
            
            {/* Campaign database split manager */}
            <div className="space-y-8 lg:col-span-8">
              
              {/* Approval Center */}
              <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-gold" />
                  <h2 className="text-lg font-bold text-white font-sans">Campaign Database Approval</h2>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                  <table className="w-full text-left border-collapse text-xs text-white/80">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Client Company</th>
                        <th className="px-4 py-3">Campaign File</th>
                        <th className="px-4 py-3">Leads Count</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {projects.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-white/30">No databases in queue.</td>
                        </tr>
                      ) : (
                        projects.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-3.5 font-bold text-white">{p.client?.companyName || 'Septic Specialists'}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-white/70">{p.uploadedFiles?.[0]?.fileName || 'leads.csv'}</td>
                            <td className="px-4 py-3.5 font-mono">{p.uploadedFiles?.[0]?.recordCount || 500}</td>
                            <td className="px-4 py-3.5">
                              <span className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                p.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                p.status === 'PENDING_APPROVAL' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {p.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-2">
                              {p.status === 'PENDING_APPROVAL' && (
                                <>
                                  <button 
                                    onClick={() => handleCampaignApproval(p.id, true)}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition"
                                    title="Approve File"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button 
                                    onClick={() => handleCampaignApproval(p.id, false)}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white transition"
                                    title="Reject File"
                                  >
                                    <X size={12} />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Workload Splits */}
              <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-5">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-gold" />
                  <h2 className="text-lg font-bold text-white font-sans">Leads workload split engine</h2>
                </div>

                <form onSubmit={handleLeadSplits} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase block mb-1.5">Select Approved Campaign</label>
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full rounded-xl bg-background border border-white/10 px-3 py-2.5 text-xs text-white outline-none focus:border-gold transition"
                      >
                        <option value="">-- Choose Campaign --</option>
                        {projects.filter(p => p.status === 'APPROVED').map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.uploadedFiles?.[0]?.recordCount || 500} records)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase block mb-1.5">Distribution Split Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setUseAutoSplit(true)}
                          className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                            useAutoSplit 
                              ? 'border-gold bg-gold/10 text-gold shadow-glow-sm' 
                              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          Auto Equal Split
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseAutoSplit(false)}
                          className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                            !useAutoSplit 
                              ? 'border-gold bg-gold/10 text-gold shadow-glow-sm' 
                              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          Manual Split
                        </button>
                      </div>
                    </div>
                  </div>

                  {!useAutoSplit && selectedProjectId && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-3.5 animate-fadeIn">
                      <span className="block text-[10px] font-bold text-gold uppercase tracking-wider">Allocate Splits Per Agent</span>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {agents.map((agent) => (
                          <div key={agent.id} className="flex items-center justify-between gap-4">
                            <span className="text-xs text-white/80">{agent.name}</span>
                            <input
                              type="number"
                              placeholder="Leads count"
                              value={manualSplits[agent.id] || ''}
                              onChange={(e) => setManualSplits(prev => ({ ...prev, [agent.id]: Number(e.target.value) }))}
                              className="w-[120px] rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-gold font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedProjectId}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold text-background hover:brightness-105 py-3 text-xs font-bold transition disabled:opacity-50"
                  >
                    <span>Trigger Workload Allocation</span>
                  </button>
                </form>

                {distributeStatus && (
                  <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-xs text-gold">
                    <AlertCircle size={14} className="text-gold" />
                    <span>{distributeStatus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Capacity workload visual details */}
            <div className="space-y-8 lg:col-span-4">
              <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-5">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <BarChart2 size={16} className="text-gold" />
                  <h2 className="text-md font-bold text-white">Agent Capacity Status</h2>
                </div>

                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{agent.name}</span>
                        <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded ${
                          agent.activeTasks > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {agent.activeTasks > 0 ? `${agent.activeTasks} Tasks` : 'Available'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-white/40 uppercase">
                          <span>Assigned capacity</span>
                          <span>{agent.activeTasks * 250 || 0} / {agent.capacity} leads</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                          <div 
                            className="h-full bg-gold rounded-full"
                            style={{ width: `${Math.min(((agent.activeTasks * 250) / agent.capacity) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9.5px] text-white/40 border-t border-white/5 pt-2 font-semibold">
                        <span>Performance rate:</span>
                        <span className="text-emerald-400 font-mono">{agent.completionRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
