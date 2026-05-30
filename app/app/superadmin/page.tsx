'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, CreditCard, Brain, Phone, FileText,
  Activity, Database, MessageSquare, Server, ShieldAlert, ArrowLeft
} from 'lucide-react';

const superAdminModules = [
  { icon: <Users className="h-5 w-5 text-gold" />, title: 'User Management', desc: 'Create, suspend, and manage all platform users and roles.' },
  { icon: <CreditCard className="h-5 w-5 text-gold" />, title: 'Subscription Billing', desc: 'View invoices, plans, and billing cycles per client.' },
  { icon: <Brain className="h-5 w-5 text-gold" />, title: 'AI Model Configuration', desc: 'Select OpenAI model, temperature, and system prompt templates.' },
  { icon: <Phone className="h-5 w-5 text-gold" />, title: 'Twilio & ElevenLabs', desc: 'Configure API keys, phone numbers, and voice profiles.' },
  { icon: <FileText className="h-5 w-5 text-gold" />, title: 'Audit Logs', desc: 'Complete platform event logs with timestamps and actor info.' },
  { icon: <Activity className="h-5 w-5 text-gold" />, title: 'System Health', desc: 'Monitor uptime, queue status, and API response times.' },
  { icon: <Database className="h-5 w-5 text-gold" />, title: 'CRM Integration', desc: 'Connect GoHighLevel, HubSpot, or Salesforce pipelines.' },
  { icon: <MessageSquare className="h-5 w-5 text-gold" />, title: 'Conversation Logs', desc: 'Full transcripts from all voice and chat sessions.' },
  { icon: <Server className="h-5 w-5 text-gold" />, title: 'Server Status', desc: 'Live infrastructure metrics and deployment health.' },
];

const systemStats = [
  { label: 'Total Users', value: '1' },
  { label: 'Active Clients', value: '1' },
  { label: 'API Calls Today', value: '0' },
  { label: 'Server Uptime', value: '100%' },
];

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role === 'superadmin') {
        setAuthorized(true);
      }
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

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
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-background transition hover:brightness-95">
              <ArrowLeft size={14} /> Back to Dashboard
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
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold mb-3">
              <ShieldAlert size={12} /> Super Admin Control Center
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white">Enterprise system management.</h1>
            <p className="mt-3 max-w-2xl text-foreground/70 leading-relaxed">
              Full platform controls for user management, billing, AI configuration, and service health monitoring.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground transition hover:bg-white/10 hover:text-gold whitespace-nowrap"
          >
            <ArrowLeft size={14} /> Admin Panel
          </Link>
        </div>

        {/* System Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {systemStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/10 bg-[#08122e] p-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-foreground/60">{stat.label}</p>
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Module Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {superAdminModules.map((mod) => (
            <div
              key={mod.title}
              className="group rounded-3xl border border-white/10 bg-[#08122e] p-6 transition hover:border-gold/20 hover:bg-[#0a1535] cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-gold/10 p-3 mt-0.5 group-hover:bg-gold/15 transition">
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
        <div className="mt-8 rounded-[24px] border border-green-500/20 bg-green-950/10 p-5 flex items-center gap-4">
          <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">System Operational</p>
            <p className="text-xs text-foreground/60 mt-0.5">
              Running in simulation mode — connect OpenAI and Twilio keys in your <code className="text-gold">.env</code> to activate live AI agents.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
