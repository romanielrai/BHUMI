'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Bot, AlertCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Unified Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle redirect param / success message from registration
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setStatus('Registration successful! Please sign in with your credentials.');
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user.role?.toUpperCase();
        if (role === 'SUPERADMIN') router.push('/dashboard');
        else if (role === 'ADMIN') router.push('/dashboard');
        else router.push('/dashboard');
      } catch (e) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  // Handle Email/Password Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setErrorMsg('');

    try {
      setStatus('Signing in to your growth cockpit...');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      setStatus('Access Granted! Redirecting...');
      const role = data.user?.role?.toUpperCase();
      setTimeout(() => {
        if (role === 'SUPERADMIN') router.push('/dashboard');
        else if (role === 'ADMIN') router.push('/dashboard');
        else router.push('/dashboard');
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected connection error occurred.');
      setStatus('');
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[440px] rounded-[24px] border border-white/10 bg-background/80 p-8 shadow-glow text-white backdrop-blur-md"
      >
        {/* Header Icon / Logo - Glassmorphic container */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20 p-2.5 shadow-md">
          <div className="flex h-full w-full items-center justify-center rounded-lg text-gold">
            <Bot size={24} className="animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="mt-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs text-white/50">
            Sign in to your AI Growth Systems account
          </p>
        </div>

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/20 p-3.5 text-xs text-red-300 font-medium"
            >
              <AlertCircle size={14} className="flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {status && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 rounded-xl border border-gold/20 bg-gold/5 p-3.5 text-xs text-gold font-semibold"
            >
              {status}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Password</label>
              <a href="#" className="text-[10px] font-semibold text-gold hover:text-white transition-all">Forgot Password?</a>
            </div>
            <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-gold/50 transition">
              <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                <Lock size={14} />
              </span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold hover:brightness-110 py-3.5 text-xs font-bold text-[#030816] transition duration-200 shadow-md shadow-gold/10 hover:scale-[1.01] disabled:opacity-50"
          >
            <span>Sign In</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Footer Redirect to Register */}
        <div className="mt-6 border-t border-white/5 pt-5 text-center">
          <p className="text-xs text-white/50">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-gold hover:text-white transition-all">
              Sign Up / Register
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="relative flex min-h-screen items-center justify-center px-4 pb-16 pt-28 md:px-6 font-sans text-white">
        <div className="text-center">
          <p className="animate-pulse text-xs text-white/50">Initializing login forms...</p>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
