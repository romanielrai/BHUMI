'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, CalendarDays, Headset } from 'lucide-react';

export default function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  return (
    <section id="home" className="relative overflow-hidden rounded-[32px] border border-white/10 bg-glass p-8 shadow-glow md:p-12">
      <div className="grid gap-12 lg:grid-cols-[1.35fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
            Enterprise AI Automation
          </div>
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl text-5xl font-semibold leading-tight text-white md:text-6xl"
            >
              Your AI Workforce Never Sleeps.
            </motion.h1>
          </div>

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

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#08102b]/95 p-6 shadow-glow"
        >
          <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">Live booking dashboard</p>
              <h2 className="mt-3 text-xl font-semibold text-white">AI call activity simulation</h2>
            </div>
            <div className="grid place-items-center rounded-3xl bg-gold/10 px-3 py-2 text-sm text-gold">Live</div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gold/10" />
                <div>
                  <p className="text-sm text-foreground/80">Active calls</p>
                  <p className="text-xl font-semibold text-white">18</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-white/50">Voice waveform</p>
              <div className="mt-4 h-24 overflow-hidden rounded-[24px] bg-[#0d1833] p-3">
                <div className="relative h-full w-full overflow-hidden">
                  <div className="absolute left-0 top-1/2 h-1 w-full animate-pulse rounded-full bg-gold/60" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <Headset className="mb-3 h-6 w-6 text-gold" />
                <p className="text-sm text-foreground/80">AI voice agent experience</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <CalendarDays className="mb-3 h-6 w-6 text-gold" />
                <p className="text-sm text-foreground/80">Appointment setter workflow</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
