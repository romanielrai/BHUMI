'use client';

import { motion } from 'framer-motion';
import HeroSection from '@/components/HeroSection';
import ServiceGrid from '@/components/ServiceGrid';
import AssistantPanel from '@/components/AssistantPanel';
import PricingSection from '@/components/PricingSection';
import ContactSection from '@/components/ContactSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="relative overflow-hidden px-6 pb-24 pt-24 md:px-12">
      <section className="mx-auto max-w-7xl">
        <HeroSection />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mx-auto mt-20 max-w-7xl"
      >
        <ServiceGrid />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="mx-auto mt-24 max-w-7xl"
      >
        <AssistantPanel />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mx-auto mt-24 max-w-6xl"
      >
        <PricingSection />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mx-auto mt-24 max-w-7xl"
      >
        <ContactSection />
      </motion.section>

      <CTASection />
      <Footer />
    </main>
  );
}
