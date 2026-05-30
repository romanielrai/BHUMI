'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, PhoneCall, CalendarDays, RefreshCw, Settings, BookOpen, ShieldCheck, BarChart3 } from 'lucide-react';

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

const adminActions = [
  { icon: <Users className="h-5 w-5 text-gold" />, title: 'Manage Clients', desc: 'View, add, or suspend client accounts.' },
  { icon: <BarChart3 className="h-5 w-5 text-gold" />, title: 'View Analytics', desc: 'Revenue, calls, and campaign performance.' },
  { icon: <PhoneCall className="h-5 w-5 text-gold" />, title: 'Review Leads', desc: 'Incoming leads from all channels.' },
  { icon: <CalendarDays className="h-5 w-5 text-gold" />, title: 'Approve Appointments', desc: 'Confirm scheduled consultations.' },
  { icon: <BookOpen className="h-5 w-5 text-gold" />, title: 'Train Chatbot', desc: 'Add knowledge base entries and scripts.' },
  { icon: <Settings className="h-5 w-5 text-gold" />, title: 'Adjust AI Scripts', desc: 'Update voice agent call scripts.' },
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role === 'admin' || user.role === 'superadmin') {
        setAuthorized(true);
        fetchLeads(token);
      }
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchLeads = async (token: string) => {
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

  return (
    <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12">
      <div className="rounded-[32px] border border-white/10 bg-glass p-8 md:p-10 shadow-glow">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold">Admin Panel</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">Client, lead & analytics management.</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const token = localStorage.getItem('token');
                if (token) fetchLeads(token);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground transition hover:bg-white/10 hover:text-gold"
            >
              <RefreshCw size={15} className={leadsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link
              href="/superadmin"
              className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-2.5 text-sm text-gold transition hover:bg-gold/10"
            >
              <ShieldCheck size={15} />
              Superadmin
            </Link>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {adminActions.map((action) => (
            <div
              key={action.title}
              className="group rounded-3xl border border-white/10 bg-[#08122e] p-5 transition hover:border-gold/20 hover:bg-[#0a1535] cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gold/10 p-3 mt-0.5">{action.icon}</div>
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
    </main>
  );
}
