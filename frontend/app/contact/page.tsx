'use client';

import React, { useState } from 'react';
import { Facebook, Mail, MessageCircle, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [business, setBusiness] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

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
          source: 'Web Form',
          clientId: 'client-default'
        })
      });

      if (!response.ok) throw new Error('Submission failed');

      setStatus('success');
      setName('');
      setEmail('');
      setPhone('');
      setBusiness('');
      setMessage('');
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12">
      <div className="rounded-[32px] border border-white/10 bg-glass p-8 md:p-12 shadow-glow">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-gold">Contact Sales</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Let’s scale your operations.</h1>
          <p className="mt-4 text-foreground/80 leading-relaxed">
            Get in touch with our enterprise AI automation architects. Submit your details below to design a custom voice or chat agent flow for your team.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Left Column: Form */}
          <section className="rounded-3xl border border-white/10 bg-[#08102e]/60 p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Request Consultation</h2>
            
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-400 animate-pulse" />
                <h3 className="text-lg font-semibold text-white">Request Submitted Successfully</h3>
                <p className="text-sm text-foreground/70 max-w-sm">
                  Our team has registered your lead in our database. You can log in to the dashboard to see your lead details live in the active tables!
                </p>
                <button
                  onClick={() => setStatus('')}
                  className="mt-4 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-xs text-foreground transition hover:bg-white/10"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {status === 'error' && (
                  <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-xs text-red-300">
                    Failed to submit. Please ensure the backend server is running.
                  </div>
                )}
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs uppercase tracking-wider text-white/60">
                    Full Name
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-wider text-white/60">
                    Email Address
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs uppercase tracking-wider text-white/60">
                    Phone Number
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 0199"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-wider text-white/60">
                    Business Name
                    <input
                      type="text"
                      required
                      value={business}
                      onChange={(e) => setBusiness(e.target.value)}
                      placeholder="Enterprise Inc."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
                    />
                  </label>
                </div>

                <label className="block text-xs uppercase tracking-wider text-white/60">
                  Message / Automation Focus
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your missed calls, intake volume, or appointment setter needs..."
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#090f24] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 resize-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-full bg-gold py-3.5 text-sm font-semibold text-background transition hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Request
                    </>
                  )}
                </button>
              </form>
            )}
          </section>

          {/* Right Column: Direct Channels */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-6">Direct Channels</h2>

            <div className="grid gap-6">
              {[
                {
                  name: 'WhatsApp',
                  value: '+1 (888) 555-0199',
                  desc: 'Instant click-to-chat. Best for quick integration support.',
                  url: 'https://wa.me/18885550199',
                  color: 'border-green-500/20 hover:border-green-500/40 bg-green-950/5',
                  icon: (
                    <div className="rounded-2xl bg-green-500/10 p-3.5 text-green-400">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                  )
                },
                {
                  name: 'Gmail',
                  value: 'hello@aigrowthsystems.com',
                  desc: 'Traditional email support for partnership queries.',
                  url: 'mailto:hello@aigrowthsystems.com',
                  color: 'border-red-500/20 hover:border-red-500/40 bg-red-950/5',
                  icon: (
                    <div className="rounded-2xl bg-red-500/10 p-3.5 text-red-400">
                      <Mail className="h-6 w-6" />
                    </div>
                  )
                },
                {
                  name: 'Facebook',
                  value: 'AI Growth Systems',
                  desc: 'Follow us for latest AI research and client cases.',
                  url: 'https://facebook.com/aigrowthsystems',
                  color: 'border-blue-500/20 hover:border-blue-500/40 bg-blue-950/5',
                  icon: (
                    <div className="rounded-2xl bg-blue-500/10 p-3.5 text-blue-400">
                      <Facebook className="h-6 w-6" />
                    </div>
                  )
                }
              ].map((channel) => (
                <a
                  key={channel.name}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-4 rounded-3xl border p-5 transition shadow-sm ${channel.color}`}
                >
                  {channel.icon}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{channel.name}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-gold bg-gold/5 px-2 py-0.5 rounded-full border border-gold/10">Active</span>
                    </div>
                    <p className="text-sm font-semibold text-white/95">{channel.value}</p>
                    <p className="text-xs text-foreground/75 leading-relaxed">{channel.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
