'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users, PhoneCall, CalendarDays, RefreshCw } from 'lucide-react';

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
            <p className="text-sm uppercase tracking-[0.3em] text-gold">Client Dashboard</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">Revenue, calls, and lead performance.</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboardData}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-3 text-foreground hover:bg-white/10 hover:text-gold transition"
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              label: 'Leads Generated', 
              value: metrics?.leadsGenerated ?? 0, 
              icon: <Users className="h-6 w-6 text-gold" /> 
            },
            { 
              label: 'Calls Answered', 
              value: metrics?.callsAnswered ?? 0, 
              icon: <PhoneCall className="h-6 w-6 text-gold" /> 
            },
            { 
              label: 'Appointments Booked', 
              value: metrics?.appointmentsBooked ?? 0, 
              icon: <CalendarDays className="h-6 w-6 text-gold" /> 
            },
            { 
              label: 'Recovered Leads', 
              value: metrics?.recoveredLeads ?? 0, 
              icon: <RefreshCw className="h-6 w-6 text-gold" /> 
            }
          ].map((metric) => (
            <div key={metric.label} className="rounded-3xl border border-white/10 bg-[#08122e] p-6 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground/70">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
              </div>
              <div className="rounded-2xl bg-gold/10 p-3">
                {metric.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#08122e]/90 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Inbound Leads</h2>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs text-gold">Live database sync</span>
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
                          lead.status === 'CONTACTED' ? 'bg-gold/10 text-gold border border-gold/20' :
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
          <section className="rounded-[28px] border border-white/10 bg-[#08122e] p-6">
            <h2 className="text-xl font-semibold text-white">Campaign Performance</h2>
            <p className="mt-3 text-foreground/80 leading-relaxed">
              Engagement rate on Missed Call Recovery campaigns is currently holding at **87.2%** over the last 30 days. Average time-to-first-response for inbound web forms is **14 seconds** via simulated SMS setters.
            </p>
          </section>
          <section className="rounded-[28px] border border-white/10 bg-[#08122e] p-6">
            <h2 className="text-xl font-semibold text-white">AI Voice Agent Simulation Analytics</h2>
            <ul className="mt-4 space-y-3 text-foreground/80">
              <li className="flex justify-between"><span>Calls received:</span> <strong className="text-white">3,420</strong></li>
              <li className="flex justify-between"><span>Average voice duration:</span> <strong className="text-white">6m 42s</strong></li>
              <li className="flex justify-between"><span>Qualified conversation rate:</span> <strong className="text-white">18.7%</strong></li>
            </ul>
          </section>
        </div>

      </div>
    </main>
  );
}
