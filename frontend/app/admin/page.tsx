'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, PhoneCall, LogOut, X, Plus, Sliders, 
  Upload, Link2, MessageSquare, AlertTriangle, PlayCircle
} from 'lucide-react';

interface Client {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  plan: string;
  industry: string;
  revenueBracket: string;
  status: string;
}

const initialClients: Client[] = [
  { id: 'client-default', companyName: 'Septic & Drain Specialists', contactName: 'John Doe', contactEmail: 'john@example.com', contactPhone: '555-0188', plan: 'DOMINANCE', industry: 'Septic & Drain', revenueBracket: '$5M–$15M', status: 'ACTIVE' },
  { id: 'client-2', companyName: 'Industrial Jetting Corp', contactName: 'Sarah Miller', contactEmail: 'sarah@jetting.com', contactPhone: '555-0144', plan: 'GROWTH', industry: 'Industrial Cleaning', revenueBracket: '$8M–$40M', status: 'ACTIVE' },
  { id: 'client-3', companyName: 'Northeast Hospital Linen', contactName: 'David Chen', contactEmail: 'dchen@hospital-linen.com', contactPhone: '555-0199', plan: 'STARTER', industry: 'Commercial Laundry', revenueBracket: '$5M–$25M', status: 'ACTIVE' }
];

export default function AgentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'clients' | 'voice' | 'engine' | 'reactivation' | 'crm' | 'inbox'>('clients');
  const [user, setUser] = useState<{ name?: string; role?: string; email?: string } | null>(null);

  // Client Manager State
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', plan: 'GROWTH', industry: 'Septic & Drain', revenueBracket: '$5M–$15M' });

  // AI Voice Builder State
  const [selectedVoiceIndustry, setSelectedVoiceIndustry] = useState('septic');
  const [callScript, setCallScript] = useState(`[Niche: Septic & Drain Callback Script]
- Trigger: Outbound dial within 10 seconds of a missed call.
- Introduction: "Hey there! This is the callback assistant for Septic Specialists. We saw we just missed a call from this number a few seconds ago and wanted to get right back to you. Did we catch you at a good time?"
- Core Goal: Qualify whether they need emergency backing-up clearing, septic pumping, or grease trap service.
- Call Action: If qualified, sync call data to ServiceTitan CRM, schedule dispatch booking, and send confirmation SMS link.`);
  
  // Script changes confirmation notice
  const [scriptSaved, setScriptSaved] = useState(false);

  // Missed Call Engine State
  const [liveMissedCalls] = useState([
    { id: 'm1', name: 'Linda Harris', phone: '+1 (555) 0134', status: 'AI Callback Initiating...', active: true },
    { id: 'm2', name: 'Robert Chen', phone: '+1 (555) 0187', status: 'Booked in CRM', active: false },
    { id: 'm3', name: 'James Evans', phone: '+1 (555) 0104', status: 'Answered (Take Over Available)', active: true }
  ]);
  const [agentListeningId, setAgentListeningId] = useState<string | null>(null);
  const [takeOverActiveId, setTakeOverActiveId] = useState<string | null>(null);

  // Reactivation Launcher State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploadStatus, setCsvUploadStatus] = useState('');
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState('septic-stale');
  const [reactivationLogs, setReactivationLogs] = useState([
    { id: 'l1', campaign: 'Spring Pump-out Campaign', contacted: 140, replies: 18, bookings: 6, date: '2026-06-06' }
  ]);

  // CRM Integrations State

  // Progress Publisher State
  const [publisherNote, setPublisherNote] = useState('');
  const [publisherStatus, setPublisherStatus] = useState('');

  // Agent Inbox State
  const [inboxMessages] = useState([
    { id: 'in1', clientName: 'Linda Harris', phone: '+1 (555) 0134', message: 'I need a tech tomorrow morning. Standard drain cleaning.', date: '10:14 AM', type: 'SMS' },
    { id: 'in2', clientName: 'Hospital Route Desk', phone: '+1 (555) 0199', message: 'Can we schedule double delivery on Tuesday?', date: '9:45 AM', type: 'SMS' }
  ]);
  const [inboxReplyText, setInboxReplyText] = useState('');
  const [selectedInboxId, setSelectedInboxId] = useState<string | null>('in1');

  const fetchClients = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients ?? []);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchConfigs = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/configs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.systemPrompt) {
          setCallScript(data.systemPrompt);
        }
        if (data.voiceScript) {
          setSelectedVoiceIndustry(data.voiceScript);
        }
      }
    } catch (err) {
      console.error('Error fetching configs:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      const role = parsedUser.role?.toUpperCase?.() || parsedUser.role;
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        setAuthorized(true);
        fetchClients();
        fetchConfigs();
      } else {
        router.push('/login');
      }
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Onboard client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: newClient.companyName,
          contactName: newClient.contactName,
          contactEmail: newClient.contactEmail,
          contactPhone: newClient.contactPhone,
          plan: newClient.plan,
          industry: newClient.industry
        })
      });
      if (res.ok) {
        fetchClients();
        setShowAddClient(false);
        setNewClient({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', plan: 'GROWTH', industry: 'Septic & Drain', revenueBracket: '$5M–$15M' });
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to onboard client');
      }
    } catch (err) {
      console.error('Error creating client:', err);
    }
  };

  // Toggle Suspend client
  const handleToggleSuspend = async (clientId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newStatus = client.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchClients();
      }
    } catch (err) {
      console.error('Error suspending/activating client:', err);
    }
  };

  // Save Call Script per Industry
  const handleSaveScript = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          voiceScript: selectedVoiceIndustry,
          systemPrompt: callScript
        })
      });
      if (res.ok) {
        setScriptSaved(true);
        setTimeout(() => setScriptSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving script configuration:', err);
    }
  };

  // Upload Dead Lead list CSV
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvUploadStatus('Uploading lead records...');
      setTimeout(() => {
        setCsvUploadStatus(`Successfully parsed ${file.name} - 150 contacts detected.`);
      }, 1500);
    }
  };

  // Launch Reactivation Campaign
  const handleLaunchCampaign = () => {
    if (!csvFile) {
      alert('Please upload a lead CSV first.');
      return;
    }
    const newCamp = {
      id: 'l-' + (reactivationLogs.length + 1),
      campaign: selectedCampaignTemplate === 'septic-stale' ? 'Septic Reactivation Run' : 'Laundry Commercial Outreach',
      contacted: 150,
      replies: 0,
      bookings: 0,
      date: new Date().toISOString().split('T')[0]
    };
    setReactivationLogs(prev => [newCamp, ...prev]);
    setCsvFile(null);
    setCsvUploadStatus('Campaign launched! Sequence active.');
    setTimeout(() => setCsvUploadStatus(''), 4000);
  };

  // Publish Note to Client Command Center
  const handlePublishNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherNote) return;
    setPublisherStatus('Pushing update note to Command Center feed...');
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ publisherNote })
      });
      if (res.ok) {
        setPublisherStatus('Published! Command Center dashboard notes updated.');
        setPublisherNote('');
        setTimeout(() => setPublisherStatus(''), 3000);
      } else {
        setPublisherStatus('Failed to publish update.');
      }
    } catch (err) {
      setPublisherStatus('Network error publishing update.');
    }
  };

  // Send Manual Reply in Inbox
  const handleInboxReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxReplyText) return;
    setInboxReplyText('');
    alert('Agent reply successfully sent to customer cell number.');
  };

  if (loading) {
    return (
      <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 text-center text-white">
        <div className="rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow">
          <p className="animate-pulse text-lg">Verifying administration permissions...</p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return null; // Next router handles redirect
  }

  return (
    <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12">
      {user?.role === 'SUPERADMIN' && (
        <div className="bg-purple-900/30 border border-purple-500/30 text-purple-200 px-5 py-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold backdrop-blur-md mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            <span>Logged in as <strong className="text-purple-300">SUPERADMIN</strong>. You are accessing the **Agent / Client Setup (Admin Panel)** view.</span>
          </div>
          <Link href="/superadmin" className="rounded-full bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 text-xs transition duration-200">
            Back to Superadmin Cockpit
          </Link>
        </div>
      )}
      <div className="rounded-[32px] border border-white/10 bg-glass p-6 md:p-10 shadow-glow space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gold border border-gold/40" />
              <p className="text-xs uppercase tracking-[0.3em] text-gold font-bold">Agent Dashboard: {user?.name || 'Agent'}</p>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Welcome Back, {user?.name || 'Systems Admin'}</h1>
            <p className="text-xs text-white/50 mt-1">Role / Profile: {user?.role || 'ADMIN'} Interface ({user?.email})</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-red-950/20 border border-red-500/20 px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-900/30 transition shadow-sm"
            >
              <LogOut size={13} /> Agent Log Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
          {[
            { id: 'clients', label: 'Client Manager', icon: <Users size={14} /> },
            { id: 'voice', label: 'AI Voice Builder', icon: <Sliders size={14} /> },
            { id: 'engine', label: 'Missed Call Engine', icon: <PhoneCall size={14} /> },
            { id: 'reactivation', label: 'Reactivation Launcher', icon: <Upload size={14} /> },
            { id: 'crm', label: 'CRM Integrations', icon: <Link2 size={14} /> },
            { id: 'inbox', label: 'Internal Inbox', icon: <MessageSquare size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold border transition ${
                activeTab === tab.id
                  ? 'bg-gold border-gold text-background'
                  : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CLIENT MANAGER */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">Client Accounts</h2>
                <p className="text-xs text-white/50">Manage accounts, industry tones, and revenue brackets.</p>
              </div>
              <button
                onClick={() => setShowAddClient(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-background hover:brightness-105 transition"
              >
                <Plus size={14} /> Onboard New Client
              </button>
            </div>

            {/* Clients Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#060e26]/50">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-white/40 font-semibold uppercase tracking-wider">
                    <th className="p-3">Company</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Niche Door</th>
                    <th className="p-3">Revenue Bracket</th>
                    <th className="p-3 text-center">Plan</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-3 font-semibold text-white">{c.companyName}</td>
                      <td className="p-3 text-white/70">{c.contactName} ({c.contactEmail}) • {c.contactPhone}</td>
                      <td className="p-3 font-medium text-gold">{c.industry}</td>
                      <td className="p-3 text-white/60">{c.revenueBracket}</td>
                      <td className="p-3 text-center font-mono font-bold text-white/90">{c.plan}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                          c.status === 'ACTIVE' 
                            ? 'bg-green-950 text-green-400 border-green-500/20' 
                            : 'bg-red-950 text-red-400 border-red-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleSuspend(c.id)}
                          className={`rounded px-2 py-1 text-[9px] font-bold border transition ${
                            c.status === 'ACTIVE'
                              ? 'bg-red-950/20 text-red-400 border-red-500/20 hover:bg-red-950/40'
                              : 'bg-green-950/20 text-green-400 border-green-500/20 hover:bg-green-950/40'
                          }`}
                        >
                          {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Progress Publisher interface */}
            <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-white/5">
              <div className="rounded-2xl border border-white/10 bg-[#060e26]/40 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Progress Publisher Console</h3>
                <p className="text-[10px] text-white/50">
                  Write a message to immediately publish to the client Command Center status banner.
                </p>
                <form onSubmit={handlePublishNote} className="space-y-3">
                  <textarea
                    required
                    value={publisherNote}
                    onChange={(e) => setPublisherNote(e.target.value)}
                    placeholder="Enter notes (e.g. Completed initial dead list CSV launch. SMS active...)"
                    className="w-full bg-[#050b1d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-gold h-20 resize-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-gold text-background px-4 py-2 text-xs font-bold hover:brightness-105"
                  >
                    Publish to Client Link
                  </button>
                </form>
                {publisherStatus && (
                  <p className="text-[10px] text-gold font-semibold animate-pulse">{publisherStatus}</p>
                )}
              </div>
            </div>

            {/* Onboard Client Modal */}
            {showAddClient && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-100">
                <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#050b1d] p-6 shadow-2xl text-white">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                    <h3 className="font-bold text-sm">Onboard Client Account</h3>
                    <button onClick={() => setShowAddClient(false)} className="text-white/60 hover:text-white"><X size={16} /></button>
                  </div>

                  <form onSubmit={handleCreateClient} className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-white/50 uppercase mb-1">Company Name</label>
                      <input
                        required
                        type="text"
                        value={newClient.companyName}
                        onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                        className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Contact Name</label>
                        <input
                          type="text"
                          value={newClient.contactName}
                          onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })}
                          className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Phone</label>
                        <input
                          type="text"
                          value={newClient.contactPhone}
                          onChange={(e) => setNewClient({ ...newClient, contactPhone: e.target.value })}
                          className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/50 uppercase mb-1">Email</label>
                      <input
                        required
                        type="email"
                        value={newClient.contactEmail}
                        onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })}
                        className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Industry</label>
                        <select
                          value={newClient.industry}
                          onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                          className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="Septic & Drain">Septic & Drain</option>
                          <option value="Industrial Cleaning">Industrial Cleaning</option>
                          <option value="Commercial Laundry">Commercial Laundry</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Revenue Bracket</label>
                        <select
                          value={newClient.revenueBracket}
                          onChange={(e) => setNewClient({ ...newClient, revenueBracket: e.target.value })}
                          className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="$5M–$15M">$5M–$15M</option>
                          <option value="$8M–$40M">$8M–$40M</option>
                          <option value="$5M–$25M">$5M–$25M</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-3">
                      <button type="button" onClick={() => setShowAddClient(false)} className="rounded-xl border border-white/10 px-4 py-2 text-xs hover:bg-white/5">Cancel</button>
                      <button type="submit" className="rounded-xl bg-gold text-background px-5 py-2 text-xs font-bold hover:brightness-105">Save Client</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI VOICE BUILDER */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">AI Voice Builder & Scripts</h2>
                <p className="text-xs text-white/50">Configure industry call prompts, logic trees, and call routing.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[250px_1fr]">
              {/* Industry Select list */}
              <div className="space-y-2">
                {[
                  { id: 'septic', label: 'Septic & Drain Script' },
                  { id: 'industrial', label: 'Industrial Cleaning' },
                  { id: 'laundry', label: 'Commercial Laundry' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedVoiceIndustry(s.id);
                      if (s.id === 'septic') {
                        setCallScript(`[Niche: Septic & Drain Callback Script]
- Trigger: Outbound dial within 10 seconds of a missed call.
- Introduction: "Hey there! This is the callback assistant for Septic Specialists. We saw we just missed a call from this number a few seconds ago and wanted to get right back to you. Did we catch you at a good time?"`);
                      } else if (s.id === 'industrial') {
                        setCallScript(`[Niche: Industrial Cleaning Reactivation Script]
- Trigger: Outbound re-engagement list dial.
- Introduction: "Hello, this is Industrial Jetting Corp. We are following up on our tank maintenance cleanout contract options from last fall. Are you the lead dispatcher?"`);
                      } else {
                        setCallScript(`[Niche: Commercial Laundry Script]
- Trigger: Inbound route answering service.
- Introduction: "Hello and thank you for calling Laundry Route Solutions. Let's look up your commercial account ID. Are you calling regarding hospitality pick-up logistics?"`);
                      }
                    }}
                    className={`w-full rounded-xl px-4 py-3 text-left text-xs font-semibold transition ${
                      selectedVoiceIndustry === s.id
                        ? 'bg-gold/10 border border-gold text-gold'
                        : 'bg-white/5 border border-transparent text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Edit script pane */}
              <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 space-y-4">
                <div>
                  <label className="block text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">System Prompt Script Editor</label>
                  <textarea
                    value={callScript}
                    onChange={(e) => setCallScript(e.target.value)}
                    className="w-full bg-[#050b1d] border border-white/10 rounded-xl p-4 font-mono text-xs text-white outline-none focus:border-gold h-72"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-white/50">Forwarding Target:</span>
                    <input
                      type="text"
                      defaultValue="+1 (555) 0188"
                      className="bg-[#050b1d] border border-white/10 rounded px-2 py-0.5 text-[10px] text-white outline-none w-28"
                    />
                  </div>

                  <button
                    onClick={handleSaveScript}
                    className="rounded-xl bg-gold text-background px-6 py-2.5 text-xs font-bold hover:brightness-105 transition"
                  >
                    Save Voice Configuration
                  </button>
                </div>

                {scriptSaved && (
                  <p className="text-xs text-emerald-400 font-semibold text-center animate-pulse">
                    ✅ Voice script synced across active instances and loaded successfully.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MISSED CALL ENGINE */}
        {activeTab === 'engine' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Missed Call Engine</h2>
              <p className="text-xs text-white/50">Live feed of missed calls. See AI trigger outbound dials instantly, listen-in, or take over.</p>
            </div>

            <div className="space-y-3">
              {liveMissedCalls.map((call) => (
                <div key={call.id} className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{call.name} ({call.phone})</p>
                      <p className="text-[10px] text-white/40 mt-0.5">Status: <strong className="text-gold">{call.status}</strong></p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {call.active ? (
                      <>
                        <button
                          onClick={() => setAgentListeningId(agentListeningId === call.id ? null : call.id)}
                          className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                            agentListeningId === call.id
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/25'
                              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                          }`}
                        >
                          {agentListeningId === call.id ? '🔇 Mute Feed' : '🎧 Listen In'}
                        </button>

                        <button
                          onClick={() => setTakeOverActiveId(takeOverActiveId === call.id ? null : call.id)}
                          className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                            takeOverActiveId === call.id
                              ? 'bg-red-950 text-red-300 border-red-500/25'
                              : 'bg-gold text-background border-gold hover:brightness-105'
                          }`}
                        >
                          {takeOverActiveId === call.id ? '🤝 AI Re-enabled' : '🎙️ Take Over Call'}
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-white/30 self-center">Session Inactive</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {agentListeningId && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex items-center gap-3 text-xs text-emerald-400">
                <PlayCircle className="h-5 w-5 animate-pulse text-emerald-400" />
                <span>🎧 Live audio stream matched. Listening to conversation outcome: &quot;AI is prompting scheduling time choices...&quot;</span>
              </div>
            )}

            {takeOverActiveId && (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4 flex items-center gap-3 text-xs text-red-400 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span>⚠️ AI script deactivated. Microphone routing active: Agent holds live call.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REACTIVATION LAUNCHER */}
        {activeTab === 'reactivation' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Reactivation Launcher</h2>
              <p className="text-xs text-white/50">Upload dead lead CSV database lists, select industry campaigns, and trigger outreach.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Launch Reactivation Campaign</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase mb-1">1. Choose Template Tone</label>
                    <select
                      value={selectedCampaignTemplate}
                      onChange={(e) => setSelectedCampaignTemplate(e.target.value)}
                      className="w-full bg-[#050b1d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="septic-stale">Septic Stale Contract Renewal (Tone: Helpful)</option>
                      <option value="cleaning-cold">Industrial Cold Outbound Blaster (Tone: Professional)</option>
                      <option value="hospitality-text">Commercial Laundry Account Revival (Tone: Direct)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 uppercase mb-1">2. Upload Dead Lead List (.csv)</label>
                    <div className="relative border border-dashed border-white/20 rounded-xl bg-white/5 p-6 text-center hover:bg-white/10 transition cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="mx-auto h-8 w-8 text-white/40 mb-2" />
                      <p className="text-xs text-white/80">Click or Drag CSV here</p>
                      <p className="text-[10px] text-white/40 mt-1">Columns required: Name, Phone, Email, Business</p>
                    </div>
                  </div>

                  {csvUploadStatus && (
                    <div className="rounded-xl bg-white/5 border border-white/5 p-3 text-[10px] text-gold font-semibold text-center animate-pulse">
                      {csvUploadStatus}
                    </div>
                  )}

                  <button
                    onClick={handleLaunchCampaign}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gold py-3 text-xs font-bold text-background transition hover:brightness-105"
                  >
                    Launch Outreach Sequence
                  </button>
                </div>
              </div>

              {/* Logs */}
              <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Reactivation History Logs</h3>
                <div className="space-y-3">
                  {reactivationLogs.map((log) => (
                    <div key={log.id} className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{log.campaign}</span>
                        <span className="text-[10px] text-white/40">{log.date}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-white/70 bg-[#04081c] p-2 rounded-lg">
                        <div>
                          <span>Contacted:</span>
                          <span className="block font-bold text-white mt-0.5">{log.contacted}</span>
                        </div>
                        <div>
                          <span>Replies:</span>
                          <span className="block font-bold text-white mt-0.5">{log.replies}</span>
                        </div>
                        <div>
                          <span>Booked:</span>
                          <span className="block font-bold text-gold mt-0.5">{log.bookings}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CRM INTEGRATIONS */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">CRM Integrations & Sync</h2>
              <p className="text-xs text-white/50">Connect clients tools to automate scheduling, dispatch dispatching, and logs directly.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { name: 'ServiceTitan', id: 'servicetitan', desc: 'Sync septic bookings, tech dispatching status, and customer notes directly.', key: 'servicetitan' },
                { name: 'HubSpot CRM', id: 'hubspot', desc: 'Sync inbound leads pipeline and lead reactivation stages automatically.', key: 'hubspot' },
                { name: 'Salesforce Enterprise', id: 'salesforce', desc: 'Sync custom fields, revenue outcomes, and call library logs.', key: 'salesforce' }
              ].map((crm) => (
                <div key={crm.id} className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-white">{crm.name}</h3>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] text-emerald-400 font-bold">
                        Connected
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 mt-2 leading-relaxed">{crm.desc}</p>
                  </div>

                  <button
                    onClick={() => alert(`${crm.name} integration details loaded for clients.`)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white py-2 text-2xs font-semibold transition"
                  >
                    Configure Sync Fields
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: INTERNAL INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Internal Inbox</h2>
              <p className="text-xs text-white/50">Lead replies route here. Read messages and schedule manually if necessary.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
              {/* Message index list */}
              <div className="space-y-2">
                {inboxMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedInboxId(msg.id)}
                    className={`w-full rounded-xl p-3 text-left border transition flex flex-col gap-1 ${
                      selectedInboxId === msg.id
                        ? 'bg-gold/10 border-gold text-white'
                        : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-white truncate">{msg.clientName}</span>
                      <span className="text-[9px] text-white/40">{msg.date}</span>
                    </div>
                    <p className="text-[10px] text-white/50 truncate w-full">{msg.message}</p>
                  </button>
                ))}
              </div>

              {/* Chat View */}
              {selectedInboxId ? (
                <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 flex flex-col justify-between min-h-[350px]">
                  <div>
                    <div className="border-b border-white/5 pb-3 mb-4">
                      <h4 className="text-xs font-bold text-white">
                        Conversation with {inboxMessages.find(m => m.id === selectedInboxId)?.clientName}
                      </h4>
                      <p className="text-[9px] text-white/40 mt-0.5">Phone: {inboxMessages.find(m => m.id === selectedInboxId)?.phone} • SMS Channel</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="rounded-xl bg-white/5 p-3 text-xs text-white max-w-[80%]">
                        <span className="text-[9px] font-bold text-gold uppercase block mb-1">Incoming Lead Text</span>
                        <p>{inboxMessages.find(m => m.id === selectedInboxId)?.message}</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleInboxReply} className="flex gap-2 pt-3 border-t border-white/5 mt-4">
                    <input
                      required
                      type="text"
                      value={inboxReplyText}
                      onChange={(e) => setInboxReplyText(e.target.value)}
                      placeholder="Type message to route manually..."
                      className="flex-1 bg-[#050b1d] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white focus:border-gold outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-gold text-background px-4 py-3 text-xs font-bold hover:brightness-105"
                    >
                      Send Reply
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-10 text-center text-white/40">
                  Select a message from the sidebar to inspect conversation transcript.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
