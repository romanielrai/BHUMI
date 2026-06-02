'use client';

import Link from 'next/link';
import { Play, ChevronRight } from 'lucide-react';

const demoHighlights = [
  { title: 'AI Receptionist Live Call', desc: 'See the voice agent handle a real inbound inquiry, qualify the lead, and book an appointment in under 3 minutes.' },
  { title: 'Missed Call Recovery Flow', desc: 'Watch how the system automatically texts back within 10 seconds of a missed call and re-engages the caller.' },
  { title: 'Dashboard Analytics', desc: 'Explore the enterprise dashboard showing real-time lead tracking, conversion metrics, and campaign performance.' },
];

export default function WatchDemoPage() {
  return (
    <main className="mx-auto mt-28 max-w-5xl px-6 pb-24 md:px-12">
      <section className="rounded-[32px] border border-white/10 bg-glass p-8 md:p-12 shadow-glow">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-gold">Watch Demo</p>
          <h1 className="mt-3 text-4xl font-semibold text-white leading-tight">
            See the AI Growth System in action.
          </h1>
          <p className="mt-4 max-w-2xl text-foreground/80 leading-relaxed">
            Explore the full platform walkthrough — voice agents, missed call automation, lead reactivation, and real-time dashboard analytics.
          </p>
        </div>

        {/* Video Placeholder */}
        <div className="relative rounded-[28px] border border-white/10 bg-[#07112e] overflow-hidden aspect-video flex items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
          <div className="relative flex flex-col items-center gap-4 text-center px-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/40 bg-gold/10 group-hover:bg-gold/20 transition-all duration-300 group-hover:scale-110">
              <Play className="h-8 w-8 text-gold ml-1" />
            </div>
            <p className="text-lg font-semibold text-white">Full Platform Demo</p>
            <p className="text-sm text-foreground/60 max-w-sm">12 minutes — covers voice agent, missed call recovery, lead reactivation, and dashboard tour.</p>
          </div>
          {/* Decorative waveform bars */}
          <div className="absolute bottom-0 inset-x-0 flex items-end justify-center gap-1 pb-6 opacity-20">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-gold"
                style={{ height: `${8 + Math.sin(i * 0.6) * 18 + Math.random() * 12}px` }}
              />
            ))}
          </div>
        </div>

        {/* Highlight chapters */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {demoHighlights.map((item, idx) => (
            <div key={item.title} className="rounded-[24px] border border-white/10 bg-[#08102f] p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-xs font-semibold text-gold">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="text-sm font-semibold text-white">{item.title}</p>
              </div>
              <p className="text-sm text-foreground/70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/book-demo"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-sm font-semibold text-background transition hover:brightness-95"
          >
            Book Live Demo <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-full border border-white/10 px-8 py-4 text-sm text-foreground transition hover:border-gold/70 hover:text-gold"
          >
            Talk to Sales
          </Link>
        </div>
      </section>
    </main>
  );
}
