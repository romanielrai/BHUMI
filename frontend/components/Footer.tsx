import Link from 'next/link';

const footerLinks = {
  Product: [
    { label: 'Services', href: '/#services' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'AI Assistant', href: '/#assistant' },
    { label: 'Watch Demo', href: '/watch-demo' },
  ],
  Company: [
    { label: 'Contact', href: '/#contact' },
    { label: 'Book Demo', href: '/book-demo' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Login', href: '/login' },
  ],
};

export default function Footer() {
  return (
    <footer className="mx-auto mt-24 max-w-7xl border-t border-white/10 pt-10 pb-12 text-sm text-foreground/70">
      <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr] md:items-start">
        <div>
          <p className="font-semibold text-lg tracking-[0.14em] text-gold">AI GROWTH SYSTEMS</p>
          <p className="mt-3 max-w-sm text-foreground/70 leading-relaxed">
            Premium AI agency infrastructure for enterprise teams — voice agents, automation, and voice-first revenue growth.
          </p>
          <p className="mt-5 text-xs text-foreground/40">
            Operating in simulation mode — connect your OpenAI and Twilio keys to activate live agents.
          </p>
        </div>
        {Object.entries(footerLinks).map(([group, links]) => (
          <div key={group} className="space-y-3">
            <p className="font-semibold text-white">{group}</p>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-foreground/70 transition hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center gap-2 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
        <p className="text-xs text-foreground/50">© 2026 AI Growth Systems. Built for enterprise automation and revenue growth.</p>
        <p className="text-xs text-foreground/40">Powered by Next.js · Express · In-memory data store</p>
      </div>
    </footer>
  );
}
