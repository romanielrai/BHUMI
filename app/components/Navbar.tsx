'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/#services' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'AI Assistant', href: '/#assistant' },
  { label: 'Contact', href: '/contact' }
];

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      setIsLoggedIn(!!token);

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsAdmin(user.role === 'admin' || user.role === 'superadmin');
          setIsSuperAdmin(user.role === 'superadmin');
        } catch (e) {
          // ignore parsing issues
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    };

    checkAuth();

    // Listen for storage events to update UI automatically if changed
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setMobileOpen(false);
    window.location.href = '/';
  };

  const allNavItems = [
    ...navItems,
    ...(isLoggedIn ? [{ label: 'Dashboard', href: '/dashboard' }] : []),
    ...(isAdmin ? [{ label: 'Admin', href: '/admin' }] : []),
    ...(isSuperAdmin ? [{ label: 'Superadmin', href: '/superadmin' }] : [])
  ];

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <Link href="/" className="font-semibold text-lg tracking-[0.18em] text-gold">
            AI GROWTH SYSTEMS
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-foreground transition hover:text-gold">
                {item.label}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                <Link href="/dashboard" className="text-sm text-foreground transition hover:text-gold">
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-sm text-foreground transition hover:text-gold font-medium">
                    Admin
                  </Link>
                )}
                {isSuperAdmin && (
                  <Link href="/superadmin" className="text-sm text-foreground transition hover:text-gold font-medium">
                    Superadmin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-gold/20 bg-gold/5 px-5 py-2.5 text-sm text-gold transition hover:bg-gold/10"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-foreground transition hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-foreground transition hover:bg-white/10"
              >
                Login
              </Link>
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
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-white/5 hover:text-gold"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 border-t border-white/10 pt-4">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-full border border-red-500/20 bg-red-950/10 px-5 py-3 text-sm text-red-300 transition hover:bg-red-950/20"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full rounded-full bg-gold px-5 py-3 text-center text-sm font-semibold text-background transition hover:brightness-95"
                  >
                    Login
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
