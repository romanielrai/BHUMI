'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, RefreshCw } from 'lucide-react';
import SuperAdminDashboard from '../../components/SuperAdminDashboard';
import AdminDashboard from '../../components/AdminDashboard';
import ClientDashboard from '../../components/ClientDashboard';
import AgentDashboard from '../../components/AgentDashboard';

export default function UnifiedDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name?: string; role?: string; email?: string } | null>(null);
  const [userRole, setUserRole] = useState<string>('CLIENT');

  const fetchDashboardData = () => {
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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
      setUserRole(role || 'CLIENT');
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const getDisplayName = () => {
    if (!user?.name) return 'Systems Specialist';
    if (user.name.includes('@')) {
      const username = user.name.split('@')[0];
      const parts = username.split(/[\._-]/);
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return user.name;
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'SUPERADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      case 'AGENT':
        return 'Outbound Agent';
      case 'CLIENT':
        return 'Client Portal';
      case 'USER':
        return 'Client Portal';
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'User';
    }
  };

  if (loading) {
    return (
      <main className="mx-auto mt-32 max-w-xl px-6 pb-24 text-center text-white">
        <div className="rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow">
          <p className="animate-pulse text-sm text-white/60">Launching unified systems control console...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12 font-sans text-white">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className={`h-[350px] w-[600px] rounded-full blur-[140px] opacity-15 transition-colors duration-500 ${
          userRole === 'SUPERADMIN' || userRole === 'ADMIN' ? 'bg-purple-600' : userRole === 'AGENT' ? 'bg-amber-600' : 'bg-blue-600'
        }`} />
      </div>

      <div className="rounded-[32px] border border-white/10 bg-glass p-6 md:p-10 shadow-glow space-y-8">
        
        {/* Dynamic Context Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/10 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full animate-ping ${
                userRole === 'SUPERADMIN' || userRole === 'ADMIN' ? 'bg-purple-500' : userRole === 'AGENT' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              <p className="text-xs uppercase tracking-[0.25em] font-bold text-white/70">
                {userRole === 'SUPERADMIN' || userRole === 'ADMIN' ? 'Enterprise System Cockpit' : userRole === 'AGENT' ? 'Agent Dialer Workspace' : 'Client Workspace Command Center'}
              </p>
            </div>
            
            <h1 className="text-2xl font-extrabold md:text-3xl bg-gradient-to-r from-white via-white to-gold bg-clip-text text-transparent">
              Welcome Back, {getDisplayName()}
            </h1>

            {/* Badges bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className={`rounded-full border px-3 py-1 text-2xs font-bold ${
                userRole === 'SUPERADMIN' || userRole === 'ADMIN' ? 'bg-purple-950/40 border-purple-500/35 text-purple-300' :
                userRole === 'AGENT' ? 'bg-amber-950/40 border-amber-500/30 text-amber-300' :
                'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              }`}>
                {getRoleLabel(userRole)}
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-2xs text-emerald-400 font-semibold">
                SYSTEMS LIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 sm:self-start lg:self-center">
            <button
               onClick={fetchDashboardData}
               className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/10 hover:text-gold"
            >
               <RefreshCw size={12} />
               <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Dashboard Conditional Mounting */}
        <div className="transition-opacity duration-300">
          {userRole === 'SUPERADMIN' && <SuperAdminDashboard />}
          {userRole === 'ADMIN' && <AdminDashboard />}
          {userRole === 'AGENT' && <AgentDashboard />}
          {userRole !== 'SUPERADMIN' && userRole !== 'ADMIN' && userRole !== 'AGENT' && <ClientDashboard />}
        </div>
      </div>
    </main>
  );
}
