import Link from 'next/link';

export default function CTASection() {
  return (
    <section id="contact" className="mt-24 rounded-[32px] border border-white/10 bg-glass p-10 text-center shadow-glow">
      <h2 className="text-3xl font-semibold text-white md:text-4xl">Ready to activate your AI workforce?</h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-foreground/80">
        Book a personalized demo, activate a trained voice agent, and deliver enterprise results with every first interaction.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link href="/book-demo" className="inline-flex rounded-full bg-gold px-8 py-4 text-sm font-semibold text-background transition hover:brightness-95">
          Book Consultation
        </Link>
        <Link href="/contact" className="inline-flex rounded-full border border-white/10 px-8 py-4 text-sm text-foreground transition hover:border-gold/70 hover:text-gold">
          Contact Sales
        </Link>
      </div>
    </section>
  );
}
