'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type FormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const { register, handleSubmit } = useForm<FormData>();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const onSubmit = async (data: FormData) => {
    setStatus('Logging in...');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Invalid credentials');
      const responseData = await response.json();
      
      if (responseData.token) {
        localStorage.setItem('token', responseData.token);
      }
      if (responseData.user) {
        localStorage.setItem('user', JSON.stringify(responseData.user));
      }
      
      setStatus('Login successful. Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch (error) {
      setStatus('Login failed. Please try again.');
    }
  };

  return (
    <main className="mx-auto mt-32 max-w-md rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow">
      <h1 className="text-3xl font-semibold text-white">Client Login</h1>
      <p className="mt-3 text-foreground/80">Access your dashboard, review leads, and manage campaigns.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <label className="block text-sm text-foreground/80">
          Email
          <input
            {...register('email')}
            required
            type="email"
            className="mt-2 w-full rounded-3xl border border-white/10 bg-[#090f24] px-4 py-3 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </label>
        <label className="block text-sm text-foreground/80">
          Password
          <input
            {...register('password')}
            required
            type="password"
            className="mt-2 w-full rounded-3xl border border-white/10 bg-[#090f24] px-4 py-3 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </label>
        <button className="w-full rounded-full bg-gold px-5 py-3 text-sm font-semibold text-background transition hover:brightness-95">
          Sign In
        </button>
      </form>
      <p className="mt-4 text-sm text-foreground/70">Need access? <Link href="/contact" className="text-gold">Contact sales</Link>.</p>
      <p className="mt-3 text-sm text-gold">{status}</p>
    </main>
  );
}
