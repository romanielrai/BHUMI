'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Play, Phone, TrendingUp, Users, PhoneIncoming } from 'lucide-react';

// ── Live activity feed items ──
const activityPool = [
  { id: 1, msg: 'AI booked appointment — Sarah M.', time: 'just now', type: 'booking' },
  { id: 2, msg: 'Missed call recovered — +1 (555) 0134', time: '12s ago', type: 'recovery' },
  { id: 3, msg: 'Lead reactivated — James T.', time: '38s ago', type: 'lead' },
  { id: 4, msg: 'AI booked appointment — Chen L.', time: '1m ago', type: 'booking' },
  { id: 5, msg: 'Inbound call answered — +1 (555) 0187', time: '2m ago', type: 'call' },
  { id: 6, msg: 'Revenue alert — $2,400 recovered', time: '3m ago', type: 'revenue' },
];

const dotColors: Record<string, string> = {
  booking: 'bg-emerald-400',
  recovery: 'bg-blue-400',
  lead: 'bg-gold',
  call: 'bg-purple-400',
  revenue: 'bg-rose-400',
};

// ── Animated waveform bar heights ──
function WaveBar({ delay }: { delay: number }) {
  return (
    <motion.div
      className="w-1 rounded-full bg-gold/70"
      animate={{ height: ['6px', '28px', '10px', '22px', '6px'] }}
      transition={{ duration: 1.4, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export default function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeCalls, setActiveCalls] = useState(18);
  const [leads, setLeads] = useState(142);
  const [revenue, setRevenue] = useState(24800);
  const [activityLog, setActivityLog] = useState(activityPool.slice(0, 4));
  const [pingActivity, setPingActivity] = useState(false);
  const tickRef = useRef(0);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  // Simulate live data ticking
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++;

      // Randomly bump stats
      if (tickRef.current % 3 === 0) setActiveCalls((v) => Math.max(14, v + Math.floor(Math.random() * 3) - 1));
      if (tickRef.current % 5 === 0) setLeads((v) => v + 1);
      if (tickRef.current % 7 === 0) setRevenue((v) => v + Math.floor(Math.random() * 400 + 100));

      // Rotate activity feed
      if (tickRef.current % 4 === 0) {
        setPingActivity(true);
        setTimeout(() => setPingActivity(false), 600);
        setActivityLog((prev) => {
          const next = activityPool[Math.floor(Math.random() * activityPool.length)];
          const updated = [{ ...next, time: 'just now' }, ...prev.slice(0, 3)];
          return updated;
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative overflow-hidden rounded-[32px] border border-white/10 bg-glass p-8 shadow-glow md:p-12">
      <div className="grid gap-12 lg:grid-cols-[1.35fr_0.9fr] lg:items-center">

        {/* ── Left: Hero copy ── */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
            Enterprise AI Automation
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl text-5xl font-semibold leading-tight text-white md:text-6xl"
          >
            Your AI Workforce Never Sleeps.
          </motion.h1>

          <div className="flex flex-col gap-4 sm:flex-row">
            {isLoggedIn ? (
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-semibold text-background transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_24px_rgba(207,199,186,0.35)] hover:scale-[1.03]">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/book-demo" className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-semibold text-background transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_24px_rgba(207,199,186,0.35)] hover:scale-[1.03]">
                Book Demo
              </Link>
            )}
            <Link href="/watch-demo" className="inline-flex items-center justify-center rounded-full border border-white/10 px-8 py-4 text-sm text-foreground transition-all duration-300 hover:border-gold/50 hover:text-gold hover:shadow-[0_0_20px_rgba(207,199,186,0.12)] hover:scale-[1.03]">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Link>
          </div>
        </div>

        {/* ── Right: Live Dashboard ── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#060e26] p-5 shadow-glow"
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">AI Control Center</p>
              <p className="mt-0.5 text-sm font-semibold text-white">Live Performance Dashboard</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Active Calls', value: activeCalls, icon: <Phone className="h-3.5 w-3.5" />, color: 'text-blue-400' },
              { label: 'Leads Today', value: leads, icon: <Users className="h-3.5 w-3.5" />, color: 'text-gold' },
              { label: 'Revenue', value: `$${(revenue / 1000).toFixed(1)}k`, icon: <TrendingUp className="h-3.5 w-3.5" />, color: 'text-emerald-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-center">
                <div className={`flex items-center justify-center gap-1 ${stat.color} mb-1`}>
                  {stat.icon}
                  <span className="text-[10px] uppercase tracking-wider font-medium">{stat.label}</span>
                </div>
                <motion.p
                  key={String(stat.value)}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-bold text-white"
                >
                  {stat.value}
                </motion.p>
              </div>
            ))}
          </div>

          {/* Waveform */}
          <div className="mb-4 rounded-2xl border border-white/8 bg-[#040a1e] px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Voice Agent — Live</p>
              <div className="flex items-center gap-1 text-[10px] text-gold">
                <PhoneIncoming className="h-3 w-3" />
                <span>Answering</span>
              </div>
            </div>
            <div className="flex h-8 items-end justify-between gap-0.5">
              {Array.from({ length: 28 }).map((_, i) => (
                <WaveBar key={i} delay={i * 0.05} />
              ))}
            </div>
          </div>

          {/* Live activity feed */}
          <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Activity Feed</p>
              <span className={`text-[10px] text-emerald-400 transition-opacity duration-300 ${pingActivity ? 'opacity-100' : 'opacity-0'}`}>
                ● New event
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {activityLog.map((item, idx) => (
                  <motion.div
                    key={`${item.id}-${item.time}-${idx}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2.5"
                  >
                    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColors[item.type] ?? 'bg-white/40'}`} />
                    <p className="flex-1 text-xs text-white/75 leading-tight truncate">{item.msg}</p>
                    <span className="text-[10px] text-white/30 flex-shrink-0">{item.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Conversion bar */}
          <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-[10px]">
              <span className="uppercase tracking-wider text-white/40">Conversion Rate</span>
              <span className="font-semibold text-gold">87.4%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                initial={{ width: '0%' }}
                animate={{ width: '87.4%' }}
                transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-white/30">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
