'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Building, Lock, CheckCircle, 
  AlertCircle, Shield, Briefcase, RefreshCw, Key
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  business: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile data states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [business, setBusiness] = useState('');
  const [role, setRole] = useState('');
  
  // Password change states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }

        const data = await response.json();
        if (response.ok && data.user) {
          const u = data.user as UserProfile;
          setName(u.name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setBusiness(u.business || '');
          setRole(u.role || '');
        } else {
          // Fallback to local storage if API is loading
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const u = JSON.parse(userStr);
            setName(u.name || '');
            setEmail(u.email || '');
            setPhone(u.phone || '');
            setBusiness(u.business || '');
            setRole(u.role || '');
          }
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
        // Fallback
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          setName(u.name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setBusiness(u.business || '');
          setRole(u.role || '');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setUpdating(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          business,
          ...(password ? { password } : {})
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccessMsg('Profile details successfully updated!');
      setPassword('');
      setConfirmPassword('');

      // Dispatch storage event so header navbar updates name immediately
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during updating');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto mt-32 max-w-xl px-6 pb-24 text-center text-white">
        <div className="rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow">
          <p className="animate-pulse text-sm text-white/60">Fetching secure profile configuration...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative mx-auto mt-32 max-w-5xl px-6 pb-24 md:px-12 font-sans text-white">
      {/* Decorative glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[300px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        
        {/* Profile Info Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/10 bg-glass p-6 flex flex-col items-center text-center shadow-glow h-fit space-y-6"
        >
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <User className="h-12 w-12" />
            <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-green-400 border-2 border-[#050b1d]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{name || 'Systems User'}</h2>
            <p className="text-xs text-white/50">{email}</p>
          </div>

          <div className="w-full border-t border-white/10 pt-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="flex items-center gap-2 text-white/40">
                <Shield size={14} /> Role
              </span>
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 font-semibold text-purple-300">
                {role}
              </span>
            </div>

            {business && (
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="flex items-center gap-2 text-white/40">
                  <Briefcase size={14} /> Business
                </span>
                <span className="font-semibold text-white/80">{business}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="flex items-center gap-2 text-white/40">
                <CheckCircle size={14} /> Status
              </span>
              <span className="rounded-full bg-green-950/20 border border-green-500/25 px-3 py-1 font-semibold text-green-400">
                ACTIVE
              </span>
            </div>
          </div>
        </motion.div>

        {/* Profile Forms Block */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/10 bg-glass p-6 md:p-8 shadow-glow"
        >
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">Profile Settings</h1>
            <p className="text-xs text-white/50 mt-1">Configure your personal information, contact credentials, and secure password.</p>
          </div>

          {/* Feedback Messages */}
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
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 font-semibold"
              >
                <CheckCircle size={14} className="flex-shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            
            {/* Form Section 1: User Account Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Account Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase block mb-1.5">Full Name</label>
                  <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 transition">
                    <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                      <User size={14} />
                    </span>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase block mb-1.5">Email Address</label>
                  <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 transition">
                    <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                      <Mail size={14} />
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email"
                      className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section 2: Business details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Client & Business info</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase block mb-1.5">Business / Company Name</label>
                  <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 transition">
                    <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                      <Building size={14} />
                    </span>
                    <input
                      type="text"
                      value={business}
                      onChange={(e) => setBusiness(e.target.value)}
                      placeholder="Company Name"
                      className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase block mb-1.5">Phone Number</label>
                  <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 transition">
                    <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                      <Phone size={14} />
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section 3: Password Update */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                <Key size={14} /> Security Password change (Leave blank to keep current)
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase block mb-1.5">New Password</label>
                  <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 transition">
                    <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase block mb-1.5">Confirm New Password</label>
                  <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 transition">
                    <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={updating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-600 px-6 py-3 text-xs font-bold text-white transition duration-200 shadow-md hover:scale-[1.01] disabled:opacity-50"
              >
                {updating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>Save Profile Changes</span>
              </button>
            </div>

          </form>
        </motion.div>

      </div>
    </main>
  );
}
