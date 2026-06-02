import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const services = [
  {
    title: 'AI Receptionist & Appointment Setter',
    description: '24/7 inbound call answering, lead qualification, appointment booking, and full report automation. Never miss a business call again.',
    tags: ['Live within 48 hours', 'Custom scripts', 'Weekly reporting'],
    href: '/book-demo',
  },
  {
    title: 'Missed Call Recovery',
    description: 'Recover callers fast with an AI-powered callback within 10 seconds, automated SMS, email alerts, and revenue reporting.',
    tags: ['Text in 10 seconds', 'AI callbacks', 'CRM integration'],
    href: '/book-demo',
  },
  {
    title: 'Dead Lead Reactivation',
    description: 'AI-driven campaigns that revive stale contacts using email, SMS, and intelligent lead scoring to uncover hidden revenue.',
    tags: ['Audit + campaign', 'Copywriting', 'Lead scoring'],
    href: '/book-demo',
  },
];

export default function ServiceGrid() {
  return (
    <section id="services" className="scroll-mt-28 space-y-10">
      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-gold">Services</p>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Premium AI workflows for fast revenue growth.</h2>
        <p className="mx-auto max-w-2xl text-base leading-8 text-foreground/80">
          Enterprise-grade AI services built for sales teams, contact centers, and service-based businesses that demand professional automation.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.title}
            className="group flex flex-col rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-glow transition hover:border-gold/20 hover:bg-white/8"
          >
            <h3 className="text-xl font-semibold text-white leading-snug">{service.title}</h3>
            <p className="mt-4 flex-1 text-foreground/80 leading-7">{service.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {service.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground/75">
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href={service.href}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition group-hover:gap-3"
            >
              Learn more <ArrowRight className="h-4 w-4 transition-all" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
