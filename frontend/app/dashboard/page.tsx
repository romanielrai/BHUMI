'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users, PhoneCall, CalendarDays, RefreshCw, Plus, Send, PhoneOutgoing, X } from 'lucide-react';

interface MetricData {
  leadsGenerated: number;
  appointmentsBooked: number;
  callsAnswered: number;
  recoveredLeads: number;
}

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  status: string;
  source: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Simulator Form State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simLead, setSimLead] = useState({ name: '', email: '', phone: '', business: '', source: 'Web Form' });
  const [submittingSim, setSubmittingSim] = useState(false);
  
  // Call simulation state
  const [callSimStatus, setCallSimStatus] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const metricsResponse = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!metricsResponse.ok) {
        if (metricsResponse.status === 401 || metricsResponse.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        throw new Error('Failed to load metrics');
      }
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.metrics);

      const leadsResponse = await fetch('/api/leads?clientId=client-default', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!leadsResponse.ok) throw new Error('Failed to load leads list');
      const leadsData = await leadsResponse.json();
      setLeads(leadsData.leads ?? []);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch data from API. Please verify the server is running.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Submit simulated lead
  const handleCreateSimulatedLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSim(true);
    const token = localStorage.getItem('token') || '';
    
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...simLead,
          clientId: 'client-default'
        })
      });

      if (res.ok) {
        setSimLead({ name: '', email: '', phone: '', business: '', source: 'Web Form' });
        setShowSimulator(false);
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit lead.');
      }
    } catch (err) {
      alert('Error submitting lead to server.');
    } finally {
      setSubmittingSim(false);
    }
  };

  // Simulate an inbound call trigger
  const handleSimulateInboundCall = async () => {
    setCallSimStatus('Connecting to voice server...');
    const token = localStorage.getItem('token') || '';
    
    try {
      // 1. Create a simulated caller lead
      const names = ['Michael Scott', 'Dwight Schrute', 'Jim Halpert', 'Pam Beesly'];
      const businesses = ['Dunder Mifflin', 'Schrute Farms', 'Athleap', 'Scranton Art'];
      const idx = Math.floor(Math.random() * names.length);

      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: names[idx],
          email: `${names[idx].toLowerCase().replace(' ', '')}@example.com`,
          phone: `555-01${Math.floor(Math.random() * 90) + 10}`,
          business: businesses[idx],
          source: 'Missed Call',
          clientId: 'client-default'
        })
      });

      if (!leadRes.ok) throw new Error('Failed to queue simulated lead');
      const leadData = await leadRes.json();
      const leadId = leadData.lead.id;

      // 2. Trigger voice call API simulation
      const callRes = await fetch('/api/voice/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          to: leadData.lead.phone,
          from: '+15550100',
          clientId: 'client-default',
          leadId
        })
      });

      if (!callRes.ok) throw new Error('Voice script error');
      
      setCallSimStatus('📞 Inbound missed! Callback triggered. Ringing customer...');
      setTimeout(() => {
        setCallSimStatus('🗣️ Connected! AI Receptionist qualified and updated lead status to CONTACTED.');
        // Update lead status to CONTACTED to simulate call outcome
        fetch(`/api/leads/${leadId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'CONTACTED' })
        }).then(() => {
          fetchDashboardData();
          setTimeout(() => setCallSimStatus(''), 5000);
        });
      }, 5000);

    } catch (e) {
      setCallSimStatus('⚠️ Twilio voice simulation channel busy. Please try again.');
      setTimeout(() => setCallSimStatus(''), 4000);
    }
  };

  if (loading && !metrics) {
    return (
      <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12">
        <div className="rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow text-center text-white">
          <p className="animate-pulse text-lg">Initializing enterprise analytics & loading records...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12">
      <div className="rounded-[32px] border border-white/10 bg-glass p-8 md:p-10 shadow-glow">
        
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-400">Client Dashboard</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">Revenue, calls, and lead performance.</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowSimulator(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500/15 border border-blue-500/30 px-5 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/25 transition shadow-sm"
            >
              <Plus size={16} /> Lead Simulator
            </button>
            <button 
              onClick={fetchDashboardData}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-3 text-foreground hover:bg-white/10 hover:text-blue-400 transition"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-950/20 border border-red-500/20 px-5 py-3 text-sm font-medium text-red-300 hover:bg-red-900/30 transition shadow-sm"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {callSimStatus && (
          <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-950/40 p-4 text-sm text-blue-200 animate-pulse flex items-center gap-3">
            <PhoneOutgoing className="h-5 w-5 text-blue-400" />
            <span className="font-semibold">{callSimStatus}</span>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              label: 'Leads Generated', 
              value: metrics?.leadsGenerated ?? 0, 
              icon: <Users className="h-6 w-6 text-blue-400" /> 
            },
            { 
              label: 'Calls Answered', 
              value: metrics?.callsAnswered ?? 0, 
              icon: <PhoneCall className="h-6 w-6 text-blue-400" /> 
            },
            { 
              label: 'Appointments Booked', 
              value: metrics?.appointmentsBooked ?? 0, 
              icon: <CalendarDays className="h-6 w-6 text-blue-400" /> 
            },
            { 
              label: 'Recovered Leads', 
              value: metrics?.recoveredLeads ?? 0, 
              icon: <RefreshCw className="h-6 w-6 text-blue-400" /> 
            }
          ].map((metric) => (
            <div key={metric.label} className="rounded-3xl border border-blue-500/10 bg-[#08122e] p-6 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground/70">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
              </div>
              <div className="rounded-2xl bg-blue-500/10 p-3">
                {metric.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#08122e]/90 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Inbound Leads</h2>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">Live database sync</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-foreground/80">
              <thead>
                <tr className="border-b border-white/10 text-white/60 font-medium">
                  <th className="pb-4 pt-2 pr-4">Lead Name</th>
                  <th className="pb-4 pt-2 px-4">Contact Info</th>
                  <th className="pb-4 pt-2 px-4">Business</th>
                  <th className="pb-4 pt-2 px-4">Source</th>
                  <th className="pb-4 pt-2 px-4 text-center">Status</th>
                  <th className="pb-4 pt-2 pl-4 text-right">Inbound Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-white/50">
                      No inbound leads found in database. Leads submitted via web/voice will show here.
                    </td>
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
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/80">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          lead.status === 'NEW' ? 'bg-blue-950 text-blue-300 border border-blue-500/20' :
                          lead.status === 'CONTACTED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-green-950 text-green-300 border border-green-500/20'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right text-xs text-white/50">
                        {new Date(lead.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-white/10 bg-[#08122e] p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Campaign Performance</h2>
              <p className="mt-3 text-foreground/80 leading-relaxed text-sm">
                Engagement rate on Missed Call Recovery campaigns is currently holding at **87.2%** over the last 30 days. Average time-to-first-response for inbound web forms is **14 seconds** via simulated SMS setters.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-2xs text-blue-300 font-semibold">Campaign: Active</span>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-2xs text-blue-300 font-semibold">Integrations: Syncing</span>
            </div>
          </section>
          <section className="rounded-[28px] border border-white/10 bg-[#08122e] p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">AI Voice Agent Simulation Analytics</h2>
              <ul className="mt-4 space-y-2 text-foreground/80 text-sm">
                <li className="flex justify-between"><span>Calls received:</span> <strong className="text-white">3,420</strong></li>
                <li className="flex justify-between"><span>Average voice duration:</span> <strong className="text-white">6m 42s</strong></li>
                <li className="flex justify-between"><span>Qualified conversation rate:</span> <strong className="text-white">18.7%</strong></li>
              </ul>
            </div>
            <button
              onClick={handleSimulateInboundCall}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-xs font-bold text-white hover:bg-blue-600 transition shadow"
            >
              <PhoneOutgoing size={13} /> Trigger Inbound Missed Call Simulation
            </button>
          </section>
        </div>

      </div>

      {/* --- LEAD SIMULATOR MODAL DIALOG --- */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#050b1d] p-6 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-semibold text-md">Lead Submission Simulator</h3>
              <button 
                onClick={() => setShowSimulator(false)} 
                className="text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateSimulatedLead} className="space-y-4">
              <div>
                <label className="block text-xs text-white/60 mb-1">Lead Name</label>
                <input 
                  type="text" 
                  required 
                  value={simLead.name}
                  onChange={(e) => setSimLead({ ...simLead, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className="w-full bg-[#08122e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Contact Email</label>
                <input 
                  type="email" 
                  required 
                  value={simLead.email}
                  onChange={(e) => setSimLead({ ...simLead, email: e.target.value })}
                  placeholder="e.g. sarah@skynet.com"
                  className="w-full bg-[#08122e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={simLead.phone}
                  onChange={(e) => setSimLead({ ...simLead, phone: e.target.value })}
                  placeholder="e.g. 555-0199"
                  className="w-full bg-[#08122e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Business Name</label>
                <input 
                  type="text" 
                  value={simLead.business}
                  onChange={(e) => setSimLead({ ...simLead, business: e.target.value })}
                  placeholder="e.g. Tech Corp"
                  className="w-full bg-[#08122e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Source channel</label>
                <select
                  value={simLead.source}
                  onChange={(e) => setSimLead({ ...simLead, source: e.target.value })}
                  className="w-full bg-[#08122e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                >
                  <option value="Web Form">Web Form</option>
                  <option value="Missed Call">Missed Call</option>
                  <option value="Cold Outbound">Cold Outbound</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowSimulator(false)} 
                  className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/80 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingSim}
                  className="rounded-full bg-blue-500 px-5 py-2 text-xs font-semibold hover:bg-blue-600 transition flex items-center gap-1.5"
                >
                  {submittingSim ? 'Submitting...' : <>Submit Lead <Send size={12} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
