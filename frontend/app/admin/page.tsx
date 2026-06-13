'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <main className="mx-auto mt-32 max-w-xl px-6 pb-24 text-center text-white">
      <div className="rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow">
        <p className="animate-pulse text-sm text-white/60">Redirecting to unified systems command console...</p>
      </div>
    </main>
  );
}
