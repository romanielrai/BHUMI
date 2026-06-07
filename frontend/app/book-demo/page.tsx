'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, Send } from 'lucide-react';

export default function BookDemoPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [business, setBusiness] = useState('');
  const [slot, setSlot] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.name) setName(user.name);
        if (user.email) setEmail(user.email);
        if (user.phone) setPhone(user.phone);
        if (user.business) setBusiness(user.business);
      } catch (e) {
        console.error('Failed to parse user details', e);
      }
    }
  }, []);

  const timeSlots = [
    'Monday 10:00 AM EST',
    'Monday 2:00 PM EST',
    'Tuesday 11:00 AM EST',
    'Wednesday 9:00 AM EST',
    'Wednesday 3:00 PM EST',
    'Thursday 1:00 PM EST',
    'Friday 10:00 AM EST',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          business,
          source: `Demo Booking – ${slot}`,
          clientId: 'client-default'
        })
      });
      if (!response.ok) throw new Error('Booking failed');
      setStatus('success');
      setName(''); setEmail(''); setPhone(''); setBusiness(''); setSlot('');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto mt-28 max-w-5xl px-6 pb-24 md:px-12">
      <div className="rounded-[32px] border border-white/10 bg-glass p-8 md:p-12 shadow-glow">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-gold">Book a Demo</p>
          <h1 className="mt-3 text-4xl font-semibold text-white leading-tight">
            Schedule your personalised AI consultation.
          </h1>
          <p className="mt-4 text-foreground/80 leading-relaxed">
            Choose a time slot and share your details — our AI growth specialist will walk you through a tailored demo of voice agents, missed call recovery, and lead reactivation for your business.
          </p>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-5">
            <div className="rounded-full bg-green-500/10 p-5">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Demo Booked!</h2>
            <p className="text-foreground/70 max-w-sm">
              We&apos;ve received your request for <strong className="text-white">{slot || 'your selected slot'}</strong>. Our team will confirm via email shortly.
            </p>
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setStatus('')}
                className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm text-foreground transition hover:bg-white/10"
              >
                Book Another
              </button>
              <Link
                href="/contact"
                className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-background transition hover:brightness-95"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            {/* Left: Info cards */}
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-[#08102f] p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-gold mb-3">What we cover</p>
                <ul className="space-y-2.5 text-sm text-foreground/80">
                  {[
                    'Live AI receptionist demo',
                    'Missed call recovery flow',
                    'Lead reactivation campaigns',
                    'Dashboard & analytics walkthrough',
                    'Custom pricing for your business'
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6">
                <CalendarDays className="h-6 w-6 text-gold mb-3" />
                <p className="text-sm font-semibold text-white">Available this week</p>
                <p className="text-xs text-foreground/70 mt-1">All calls are 30 minutes via Google Meet or Zoom. You&apos;ll receive a calendar invite after booking.</p>
              </div>
            </div>

            {/* Right: Booking form */}
            <section className="rounded-3xl border border-white/10 bg-[#08102e]/60 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Your Details</h2>
              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                {status === 'error' && (
                  <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-xs text-red-300">
                    Booking failed. Please check your details or try again.
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs uppercase tracking-wider text-white/60">
                    Full Name
                    <input
                      type="text" required value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder=""
                      autoComplete="new-name"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-wider text-white/60">
                    Email Address
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=""
                      autoComplete="new-email"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs uppercase tracking-wider text-white/60">
                    Phone Number
                    <input
                      type="tel" required value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=""
                      autoComplete="new-phone"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-wider text-white/60">
                    Business Name
                    <input
                      type="text" required value={business}
                      onChange={(e) => setBusiness(e.target.value)}
                      placeholder=""
                      autoComplete="new-business"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                    />
                  </label>
                </div>

                <label className="block text-xs uppercase tracking-wider text-white/60">
                  Preferred Time Slot
                  <select
                    required value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                  >
                    <option value="" disabled>Select a time slot...</option>
                    {timeSlots.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit" disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-full bg-gold py-3.5 text-sm font-semibold text-background transition hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking...' : (
                    <><Send className="mr-2 h-4 w-4" /> Book My Demo</>
                  )}
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
