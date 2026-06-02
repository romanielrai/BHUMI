'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/#services' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'AI Assistant', href: '/#assistant' },
  { label: 'Contact', href: '/#contact' }
];

export default function Navbar() {
  // ── Auth state (legacy localStorage + next-auth) ──
  const { data: session } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // ── Glow tracking ──
  const headerRef = useRef<HTMLElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [glowVisible, setGlowVisible] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const header = headerRef.current;
    if (!header) return;
    const rect = header.getBoundingClientRect();
    setGlowPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setGlowVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setGlowVisible(false);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    header.addEventListener('mousemove', handleMouseMove);
    header.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      header.removeEventListener('mousemove', handleMouseMove);
      header.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  // ── Legacy auth check ──
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      setIsLoggedIn(!!token);

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          const role = user.role?.toUpperCase?.() || user.role;
          setUserRole(role);
        } catch {
          // ignore
        }
      } else {
        setUserRole(null);
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Determine combined login state (legacy OR Google session)
  const effectiveLoggedIn = isLoggedIn || !!session;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserRole(null);
    setMobileOpen(false);

    if (session) {
      signOut({ callbackUrl: '/' });
    } else {
      window.location.href = '/';
    }
  };

  let dashboardLink = null;
  if (effectiveLoggedIn) {
    if (userRole === 'SUPERADMIN') {
      dashboardLink = { label: 'Superadmin Panel', href: '/superadmin' };
    } else if (userRole === 'ADMIN') {
      dashboardLink = { label: 'Admin Panel', href: '/admin' };
    } else if (userRole === 'USER') {
      dashboardLink = { label: 'User Dashboard', href: '/dashboard/user' };
    } else {
      dashboardLink = { label: 'Client Dashboard', href: '/dashboard' };
    }
  }

  const allNavItems = [
    ...navItems,
    ...(dashboardLink ? [dashboardLink] : [])
  ];

  return (
    <>
      <motion.header
        ref={headerRef}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-xl overflow-hidden"
      >
        {/* ── Mouse-tracking glow ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: glowVisible ? 1 : 0,
            background: `radial-gradient(600px circle at ${glowPos.x}px ${glowPos.y}px, rgba(207,199,186,0.07), transparent 40%)`
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <Link
            href="/"
            onClick={(e) => {
              // If already on home, scroll to top; otherwise navigate home
              if (typeof window !== 'undefined' && window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="font-semibold text-lg tracking-[0.18em] text-gold"
          >
            AI GROWTH SYSTEMS
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (item.href === '/') {
                    if (typeof window !== 'undefined' && window.location.pathname === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                }}
                className="text-sm text-foreground transition hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            {effectiveLoggedIn ? (
              <>
                {/* Google user avatar */}
                {session?.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? 'User'}
                    width={32}
                    height={32}
                    className="rounded-full border border-gold/30"
                  />
                )}
                {dashboardLink && (
                  <Link
                    href={dashboardLink.href}
                    className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-2.5 text-sm text-gold transition-all duration-300 hover:bg-gold/10 hover:shadow-[0_0_18px_rgba(207,199,186,0.2)] hover:scale-[1.03]"
                  >
                    <LayoutDashboard size={14} />
                    {dashboardLink.label}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_16px_rgba(255,255,255,0.06)] hover:scale-[1.03]"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {/* Google Sign In button */}
                <button
                  onClick={() => signIn('google')}
                  className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-foreground transition-all duration-300 hover:bg-white/10 hover:border-gold/30 hover:shadow-[0_0_20px_rgba(66,133,244,0.15)] hover:scale-[1.03] group"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="group-hover:text-gold transition">Sign in with Google</span>
                </button>

                {/* Portal Login */}
                <Link
                  href="/login"
                  className="rounded-full border border-gold/20 bg-gold/5 px-5 py-2.5 text-sm font-medium text-gold transition-all duration-300 hover:bg-gold/10 hover:shadow-[0_0_20px_rgba(207,199,186,0.2)] hover:scale-[1.03]"
                >
                  Portal Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex items-center rounded-full bg-gold/10 px-4 py-3 text-sm font-medium text-gold shadow-sm transition hover:bg-gold/20 md:hidden"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[73px] z-40 border-b border-white/10 bg-background/98 backdrop-blur-xl md:hidden"
          >
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-5">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    setMobileOpen(false);
                    if (item.href === '/') {
                      if (typeof window !== 'undefined' && window.location.pathname === '/') {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        // let Next handle navigation
                      }
                    }
                  }}
                  className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-white/5 hover:text-gold"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
                {effectiveLoggedIn ? (
                  <>
                    {session?.user && (
                      <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                        {session.user.image && (
                          <Image
                            src={session.user.image}
                            alt={session.user.name ?? 'User'}
                            width={28}
                            height={28}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{session.user.name}</p>
                          <p className="text-xs text-foreground/50">{session.user.email}</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-full border border-red-500/20 bg-red-950/10 px-5 py-3 text-sm text-red-300 transition hover:bg-red-950/20"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setMobileOpen(false); signIn('google'); }}
                      className="flex w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-foreground transition hover:bg-white/10"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Sign in with Google
                    </button>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full rounded-full bg-gold px-5 py-3 text-center text-sm font-semibold text-background transition hover:brightness-95"
                    >
                      Portal Login
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
