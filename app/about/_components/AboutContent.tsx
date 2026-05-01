"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Heart, Sparkles, Star, Phone, MapPin, Clock } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

const values = [
  {
    icon: Heart,
    title: "Care First",
    body: "Every treatment is delivered with genuine attention and warmth. You are not just a booking — you are a guest.",
  },
  {
    icon: Sparkles,
    title: "Quality Craft",
    body: "Our specialists hold international certifications and train continuously. Excellence is our baseline.",
  },
  {
    icon: Star,
    title: "Real Results",
    body: "We use proven techniques and premium products so every visit leaves you looking and feeling noticeably better.",
  },
];

const info = [
  { icon: MapPin, label: "Location", value: "Muscat, Oman" },
  { icon: Phone, label: "Phone", value: "+968 9X XX XXXX" },
  { icon: Clock, label: "Hours", value: "Sat – Thu · 9 AM – 9 PM" },
];

export default function AboutContent() {
  useEffect(() => {
    try {
      localStorage.setItem("au", "1");
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[520px] md:min-h-[600px] flex items-end overflow-hidden">
        <motion.div
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600)",
            filter: "saturate(0.75) contrast(1.05)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/92 via-dark/45 to-dark/10" />

        <div className="relative z-10 px-6 md:px-14 pb-14 md:pb-20 max-w-[1400px] mx-auto w-full">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-accent/80 text-xs uppercase tracking-[0.22em] font-medium mb-3"
          >
            Our story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl font-bold text-light tracking-tight leading-tight max-w-[640px]"
          >
            Where wellness meets artistry.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-light/55 text-base md:text-lg mt-5 max-w-[520px] leading-relaxed"
          >
            WellnessHub is Muscat&apos;s destination for expert beauty, fitness, and self-care — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-3 mt-8"
          >
            <Link
              href="/"
              className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-primary text-light
                         text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Explore Services
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-light/12 text-light
                         text-sm font-medium hover:bg-light/20 transition-colors backdrop-blur-sm"
            >
              Contact Us
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────────────── */}
      <section className="bg-light py-16 md:py-24 px-6 md:px-14 max-w-[1400px] mx-auto">
        <Section className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <motion.p variants={fadeUp} className="text-secondary text-xs uppercase tracking-[0.2em] font-semibold mb-3">
              Who we are
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-dark leading-tight mb-5 tracking-tight">
              More than a salon. A sanctuary.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-dark/55 text-sm leading-relaxed mb-4">
              Founded in Muscat, WellnessHub brings together the finest beauty specialists, fitness instructors, and
              skin therapists under one roof. We believe self-care is not a luxury — it&apos;s a right.
            </motion.p>
            <motion.p variants={fadeUp} className="text-dark/55 text-sm leading-relaxed">
              Whether you&apos;re here for a quick blow-dry or a full advanced skin treatment, every visit is designed
              to leave you refreshed, confident, and cared for.
            </motion.p>
          </div>

          <motion.div variants={fadeUp} className="relative aspect-[4/3] rounded-3xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900"
              alt="WellnessHub interior"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
          </motion.div>
        </Section>
      </section>

      {/* ── Values ───────────────────────────────────────────────────────────── */}
      <section className="bg-dark/[0.025] py-16 md:py-20 px-6 md:px-14">
        <div className="max-w-[1400px] mx-auto">
          <Section>
            <motion.p variants={fadeUp} className="text-secondary text-xs uppercase tracking-[0.2em] font-semibold mb-3">
              Our values
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-dark mb-12 tracking-tight">
              What drives everything we do
            </motion.h2>
          </Section>

          <Section className="grid md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, body }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className="bg-light rounded-3xl p-7 flex flex-col gap-4 shadow-sm shadow-dark/5"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icon size={20} className="text-primary" strokeWidth={1.7} />
                </div>
                <h3 className="text-base font-bold text-dark">{title}</h3>
                <p className="text-sm text-dark/55 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <section className="bg-primary py-12 px-6 md:px-14">
        <Section className="max-w-[1400px] mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { num: "5+", label: "Years of excellence" },
            { num: "2,000+", label: "Happy clients" },
            { num: "30+", label: "Services offered" },
          ].map(({ num, label }) => (
            <motion.div key={label} variants={fadeUp}>
              <p className="text-3xl md:text-4xl font-bold text-light tabular-nums">{num}</p>
              <p className="text-xs md:text-sm text-light/55 mt-1 font-medium">{label}</p>
            </motion.div>
          ))}
        </Section>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────────── */}
      <section id="contact" className="bg-light py-16 md:py-24 px-6 md:px-14">
        <div className="max-w-[1400px] mx-auto">
          <Section>
            <motion.p variants={fadeUp} className="text-secondary text-xs uppercase tracking-[0.2em] font-semibold mb-3">
              Get in touch
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-dark mb-10 tracking-tight">
              Visit us or reach out
            </motion.h2>
          </Section>

          <Section className="grid md:grid-cols-2 gap-10 items-start">
            <div className="flex flex-col gap-5">
              {info.map(({ icon: Icon, label, value }) => (
                <motion.div key={label} variants={fadeUp} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-primary" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-xs text-dark/40 font-medium uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-semibold text-dark mt-0.5">{value}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div variants={fadeUp} className="mt-4 flex gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-primary text-light
                             text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Book Now
                </Link>
              </motion.div>
            </div>

            <motion.div
              variants={fadeUp}
              className="relative aspect-video rounded-3xl overflow-hidden bg-dark/5"
            >
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900"
                alt="WellnessHub contact"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </Section>
        </div>
      </section>
    </>
  );
}
