import React from 'react';
import '../styles/globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'AI Growth Systems',
  description: 'Enterprise AI automation for appointments, missed calls, and lead reactivation.',
  icons: '/favicon.ico'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <AuthProvider>
          <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(143,122,103,.18),_transparent_40%),linear-gradient(180deg,_#02061D_0%,_#050B24_100%)]">
            <Navbar />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
