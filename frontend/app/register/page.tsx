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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Form State (Defaulting role to USER / normal user)
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('GROWTH');
  const [useCase, setUseCase] = useState('AI Receptionist');
  const [aiFocus, setAiFocus] = useState('');

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1) {
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
      setStep(2);
    }
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

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
          plan: selectedPlan,
          useCase,
          aiFocus
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

  const plans = [
    { id: 'STARTER', label: 'Starter', price: '$1,497/mo' },
    { id: 'GROWTH', label: 'Growth', price: '$2,997/mo' },
    { id: 'DOMINANCE', label: 'Dominance', price: '$5,997/mo' }
  ];

  const useCases = [
    'AI Receptionist',
    'Missed Call Recovery',
    'Dead Lead Reactivation',
    'Appointment strategy setter'
  ];

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
              {step === 2 ? 'Onboarding & Goals' : 'Create Account'}
            </h1>
            <p className="mt-1 text-xs text-white/50">
              Join the AI Growth Systems community today
            </p>
          </div>

          {/* Progress Steps Bar - 2 steps */}
          <div className="mt-8 relative flex items-center justify-between px-16">
            {/* Background line */}
            <div className="absolute left-16 right-16 top-1/2 h-[2px] -translate-y-1/2 bg-white/10 z-0" />
            
            {/* Active line */}
            <div 
              className="absolute left-16 top-1/2 h-[2px] -translate-y-1/2 bg-red-600 transition-all duration-300 z-0" 
              style={{ width: step === 2 ? '100%' : '0%' }}
            />

            {/* Step 1 Circle */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition duration-300 ${
                step > 1 
                  ? 'bg-red-700 border-red-700 text-white' 
                  : 'border-red-600 bg-background text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.3)]'
              }`}>
                {step > 1 ? <Check size={14} className="stroke-[3]" /> : '1'}
              </div>
              <span className={`mt-2 text-[9px] font-bold tracking-wider uppercase transition ${
                step === 1 ? 'text-red-400' : 'text-white/40'
              }`}>Account</span>
            </div>

            {/* Step 2 Circle */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition duration-300 ${
                step === 2 
                  ? 'border-red-600 bg-background text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.3)]' 
                  : 'border-white/20 bg-background text-white/40'
              }`}>
                '2'
              </div>
              <span className={`mt-2 text-[9px] font-bold tracking-wider uppercase transition ${
                step === 2 ? 'text-red-400' : 'text-white/40'
              }`}>Setup</span>
            </div>
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
          <div className="mt-8">
            {step === 1 && (
              <div className="space-y-4">
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
                      placeholder="John Doe"
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
                      placeholder="+1 (555) 000-0000"
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
                      placeholder="you@example.com"
                      className="w-full bg-transparent py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 py-3.5 text-xs font-bold text-white transition duration-200 shadow-md hover:scale-[1.01] pt-4"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div>
                  <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase block mb-2">Selected Growth Plan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {plans.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlan(p.id)}
                        className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition ${
                          selectedPlan === p.id 
                            ? 'border-red-600 bg-white/5 text-white' 
                            : 'border-white/10 bg-white/3 text-white/50 hover:border-white/20'
                        }`}
                      >
                        <span className="text-[10px] font-bold">{p.label}</span>
                        <span className="mt-0.5 text-[9px] opacity-75 font-mono">{p.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase block mb-2">Primary Automation Use Case</label>
                  <div className="relative rounded-xl bg-white/5 border border-white/10 focus-within:border-gold/50 transition">
                    <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                      <Bot size={14} />
                    </span>
                    <select
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      className="w-full bg-[#0c1433]/90 py-3 pl-11 pr-4 text-xs text-white rounded-xl outline-none border-none appearance-none"
                    >
                      {useCases.map(uc => (
                        <option key={uc} value={uc}>{uc}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/30">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase block mb-2">AI Custom Onboarding Goals (Optional)</label>
                  <textarea
                    value={aiFocus}
                    onChange={(e) => setAiFocus(e.target.value)}
                    placeholder="Describe your custom AI requirements or goals..."
                    rows={2}
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white placeholder-white/30 outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/25 transition resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-3.5 text-xs font-semibold text-white transition duration-200 disabled:opacity-50"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 py-3.5 text-xs font-bold text-white transition duration-200 shadow-md hover:scale-[1.01] disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    <span>Complete Signup</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Link */}
          <div className="mt-6 border-t border-white/5 pt-5 text-center">
            <p className="text-xs text-white/50">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-red-400 hover:text-red-300 transition">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
