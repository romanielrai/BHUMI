'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle,
  Bot
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Form State (Defaulting role to USER / normal user)
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter your phone number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter a password');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      setStatusMsg('Creating your account...');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          roleName: 'USER',
          phoneNumber,
          businessName: 'Personal Workspace',
          industry: 'Other',
          plan: 'GROWTH',
          useCase: 'AI Receptionist',
          aiFocus: ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setStatusMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration. Is the backend server running?');
      setStatusMsg('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 pb-16 pt-28 md:px-6 font-sans">
      {/* Decorative background blur */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[400px] w-[600px] rounded-full bg-gold/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-[460px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-[24px] border border-white/10 bg-background/80 p-8 shadow-glow text-white backdrop-blur-md"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create Account
            </h1>
            <p className="mt-1 text-xs text-white/50">
              Join the AI Growth Systems community today
            </p>
          </div>

          {/* Alerts */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/20 p-3.5 text-xs text-red-300 font-medium"
              >
                <AlertCircle size={14} className="flex-shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 rounded-xl border border-gold/20 bg-gold/5 p-3.5 text-xs text-gold font-semibold"
              >
                {statusMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase block mb-2">Full Name</label>
              <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-gold/50 transition">
                <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                  <User size={14} />
                </span>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase block mb-2">Phone Number</label>
              <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-gold/50 transition">
                <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                  <Phone size={14} />
                </span>
                <input
                  required
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase block mb-2">Email Address</label>
              <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-gold/50 transition">
                <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                  <Mail size={14} />
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase block mb-2">Password</label>
                <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-gold/50 transition">
                  <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                    <Lock size={14} />
                  </span>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase block mb-2">Confirm</label>
                <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-gold/50 transition">
                  <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                    <Lock size={14} />
                  </span>
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold hover:brightness-110 py-3.5 text-xs font-bold text-[#030816] transition duration-200 shadow-md shadow-gold/10 hover:scale-[1.01] disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>Complete Signup</span>
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 border-t border-white/5 pt-5 text-center">
            <p className="text-xs text-white/50">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-gold hover:text-white transition-all">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
