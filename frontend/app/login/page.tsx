'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Briefcase, ArrowRight, Bot } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [status, setStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user.role?.toUpperCase();
        if (role === 'SUPERADMIN') router.push('/superadmin');
        else if (role === 'ADMIN') router.push('/admin');
        else if (role === 'USER') router.push('/dashboard/user');
        else router.push('/dashboard');
      } catch (e) {
        router.push('/dashboard');
      }
    } else if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Sign Up Flow
        setStatus('Creating account...');
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name,
            phoneNumber,
            businessName,
            roleName: 'CLIENT'
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        // Auto-login after successful registration
        setStatus('Account created! Logging you in...');
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error('Registration succeeded, but auto-login failed. Please sign in manually.');
        }

        if (loginData.token) localStorage.setItem('token', loginData.token);
        if (loginData.user) localStorage.setItem('user', JSON.stringify(loginData.user));

        setStatus('Registration successful! Redirecting...');
        const role = loginData.user?.role?.toUpperCase();
        setTimeout(() => {
          if (role === 'SUPERADMIN') router.push('/superadmin');
          else if (role === 'ADMIN') router.push('/admin');
          else if (role === 'USER') router.push('/dashboard/user');
          else router.push('/dashboard');
        }, 800);

      } else {
        // Sign In Flow
        setStatus('Signing in...');
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

        setStatus('Sign in successful! Redirecting...');
        const role = data.user?.role?.toUpperCase();
        setTimeout(() => {
          if (role === 'SUPERADMIN') router.push('/superadmin');
          else if (role === 'ADMIN') router.push('/admin');
          else if (role === 'USER') router.push('/dashboard/user');
          else router.push('/dashboard');
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg('');
    setStatus('');
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 pb-16 pt-28 md:px-6">
      {/* Decorative premium background blur */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[400px] w-[600px] rounded-full bg-gold/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[460px] rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl text-slate-900"
      >
        {/* Header Icon / Logo */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-sm">
          <Bot size={28} className="animate-pulse" />
        </div>

        {/* Dynamic Titles */}
        <div className="mt-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSignUp ? 'Join AI Growth Systems today' : 'Sign in to your AI Growth Systems account'}
          </p>
        </div>

        {/* Status / Error Alerts */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-medium"
            >
              {errorMsg}
            </motion.div>
          )}
          {status && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-xs text-gold font-semibold"
            >
              {status}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration / Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <>
              {/* Full Name */}
              <div>
                <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Full Name</label>
                <div className="relative mt-1.5 rounded-2xl bg-[#f8fafc] border border-slate-100 focus-within:border-gold/50 transition">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Phone Number</label>
                <div className="relative mt-1.5 rounded-2xl bg-[#f8fafc] border border-slate-100 focus-within:border-gold/50 transition">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <Phone size={16} />
                  </span>
                  <input
                    required
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Business Name</label>
                <div className="relative mt-1.5 rounded-2xl bg-[#f8fafc] border border-slate-100 focus-within:border-gold/50 transition">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <Briefcase size={16} />
                  </span>
                  <input
                    required
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Acme Corporation"
                    className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Email Address</label>
            <div className="relative mt-1.5 rounded-2xl bg-[#f8fafc] border border-slate-100 focus-within:border-gold/50 transition">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                <Mail size={16} />
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center">
              <label className="text-xxs font-bold text-slate-400 tracking-wider uppercase">Password</label>
              {!isSignUp && (
                <Link
                  href="/contact"
                  className="text-xs font-semibold text-gold hover:brightness-95 transition"
                >
                  Forgot Password?
                </Link>
              )}
            </div>
            <div className="relative mt-1.5 rounded-2xl bg-[#f8fafc] border border-slate-100 focus-within:border-gold/50 transition">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                <Lock size={16} />
              </span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-4 text-sm font-semibold text-background transition-all duration-300 hover:brightness-105 hover:shadow-[0_4px_20px_rgba(207,199,186,0.35)] disabled:opacity-50"
          >
            <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-5">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-gold hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-gold hover:underline"
              >
                Sign Up / Register
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </main>
  );
}
