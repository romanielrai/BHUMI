'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, MessageCircle, Mail, Facebook, User, Phone, Briefcase } from 'lucide-react';

export default function ContactSection() {
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
          source: 'Homepage Contact Form',
          clientId: 'client-default',
        }),
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

  const channels = [
    {
      name: 'WhatsApp',
      value: '+1 (888) 555-0199',
      desc: 'Instant click-to-chat. Best for fast integration support.',
      url: 'https://wa.me/18885550199',
      color: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/10 text-emerald-400',
      icon: <MessageCircle className="h-6 w-6" />,
    },
    {
      name: 'Gmail',
      value: 'hello@aigrowthsystems.com',
      desc: 'Traditional email support for partnership queries.',
      url: 'mailto:hello@aigrowthsystems.com',
      color: 'border-rose-500/20 hover:border-rose-500/40 bg-rose-950/10 text-rose-400',
      icon: <Mail className="h-6 w-6" />,
    },
    {
      name: 'Facebook',
      value: 'AI Growth Systems',
      desc: 'Follow us for latest AI research and client cases.',
      url: 'https://facebook.com/aigrowthsystems',
      color: 'border-blue-500/20 hover:border-blue-500/40 bg-blue-950/10 text-blue-400',
      icon: <Facebook className="h-6 w-6" />,
    },
  ];

  return (
    <section id="contact" className="scroll-mt-28 mt-24 rounded-[32px] border border-white/10 bg-glass shadow-glow overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 p-6 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-gold">Contact Sales</p>
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Let’s scale your operations.</h2>
        <p className="mt-1.5 text-sm text-foreground/70">
          Get in touch with our AI automation architects to design a custom voice or chat agent flow.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr] border-t border-white/0">
        {/* Left Column: Form */}
        <div className="p-6 md:p-10 border-r border-white/10">
          <h3 className="text-lg font-semibold text-white mb-6">Request Consultation</h3>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 text-center space-y-4"
              >
                <div className="rounded-full bg-green-500/10 p-4">
                  <CheckCircle2 className="h-10 w-10 text-green-400 animate-bounce" />
                </div>
                <h4 className="text-lg font-semibold text-white font-medium">Request Submitted Successfully</h4>
                <p className="text-sm text-foreground/70 max-w-sm">
                  Our team has registered your details. Check your client dashboard live to review this lead profile!
                </p>
                <button
                  onClick={() => setStatus('')}
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-xs text-foreground transition hover:bg-white/10"
                >
                  Submit Another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {status === 'error' && (
                  <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-xs text-red-300">
                    Failed to submit. Please verify the backend server is active.
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Full Name</label>
                    <div className="relative mt-1.5 rounded-2xl bg-[#090f24] border border-white/10 focus-within:border-gold/50 transition">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <User size={16} />
                      </span>
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Email Address</label>
                    <div className="relative mt-1.5 rounded-2xl bg-[#090f24] border border-white/10 focus-within:border-gold/50 transition">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <Mail size={16} />
                      </span>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Phone Number</label>
                    <div className="relative mt-1.5 rounded-2xl bg-[#090f24] border border-white/10 focus-within:border-gold/50 transition">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <Phone size={16} />
                      </span>
                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 0199"
                        className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Business Name</label>
                    <div className="relative mt-1.5 rounded-2xl bg-[#090f24] border border-white/10 focus-within:border-gold/50 transition">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <Briefcase size={16} />
                      </span>
                      <input
                        required
                        type="text"
                        value={business}
                        onChange={(e) => setBusiness(e.target.value)}
                        placeholder="Enterprise Inc."
                        className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Message / Focus</label>
                  <div className="relative mt-1.5 rounded-2xl bg-[#090f24] border border-white/10 focus-within:border-gold/50 transition">
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your automation needs..."
                      className="w-full rounded-2xl bg-transparent p-4 text-sm text-white outline-none placeholder:text-white/20 resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-sm font-semibold text-background transition hover:brightness-105 disabled:opacity-60"
                >
                  <Send size={15} />
                  <span>{loading ? 'Submitting...' : 'Send Request'}</span>
                </button>
              </form>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Direct Channels */}
        <div className="p-6 md:p-10 bg-[#06101f]/30 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-white mb-6">Direct Channels</h3>

          <div className="space-y-4">
            {channels.map((channel) => (
              <a
                key={channel.name}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 rounded-2xl border border-white/5 bg-[#040a1e]/60 p-4 transition-all duration-300 hover:border-gold/20 hover:bg-[#040a1e]/80"
              >
                <div className={`rounded-xl border p-2.5 ${channel.color}`}>
                  {channel.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{channel.name}</h4>
                    <span className="text-[9px] uppercase tracking-wider text-gold bg-gold/5 px-2 py-0.5 rounded-full border border-gold/10">Active</span>
                  </div>
                  <p className="text-xs font-semibold text-white/95">{channel.value}</p>
                  <p className="text-xxs text-foreground/60 leading-normal">{channel.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
