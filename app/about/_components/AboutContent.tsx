"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Heart, Sparkles, Star, Phone, MapPin, Clock } from "lucide-react";

function InstagramIcon({ size = 17, className = "" }: { size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}
import { useLang } from "@/lib/lang-context";

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

export default function AboutContent() {
  const { t } = useLang();

  useEffect(() => {
    try {
      localStorage.setItem("au", "1");
    } catch {
      // ignore
    }
  }, []);

  const values = [
    { icon: Heart,    titleKey: "about.val1Title", bodyKey: "about.val1Body" },
    { icon: Sparkles, titleKey: "about.val2Title", bodyKey: "about.val2Body" },
    { icon: Star,     titleKey: "about.val3Title", bodyKey: "about.val3Body" },
  ];

  const info = [
    { icon: MapPin,     labelKey: "about.location",      valueKey: "about.locationValue",  href: "https://maps.app.goo.gl/SJCGLfnW1ffE5Bym7" },
    { icon: Phone,      labelKey: "about.phone",          valueKey: "about.phoneValue",     href: "tel:+96899829821" },
    { icon: Clock,      labelKey: "about.hours",          valueKey: "about.hoursValue",     href: null },
    { icon: InstagramIcon, labelKey: "about.instagram",    valueKey: "about.instagramValue", href: "https://www.instagram.com/ultwellness__" },
  ];

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
            {t("about.heroSubtitle")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl font-bold text-light tracking-tight leading-tight max-w-[640px]"
          >
            {t("about.heroHeadline")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-light/55 text-base md:text-lg mt-5 max-w-[520px] leading-relaxed"
          >
            {t("about.heroBody")}
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
              {t("about.exploreServices")}
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-light/12 text-light
                         text-sm font-medium hover:bg-light/20 transition-colors backdrop-blur-sm"
            >
              {t("about.contactUs")}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────────────── */}
      <section className="bg-light py-16 md:py-24 px-6 md:px-14 max-w-[1400px] mx-auto">
        <Section className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <motion.p variants={fadeUp} className="text-secondary text-xs uppercase tracking-[0.2em] font-semibold mb-3">
              {t("about.whoWeAre")}
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-dark leading-tight mb-5 tracking-tight">
              {t("about.missionHeadline")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-dark/55 text-sm leading-relaxed mb-4">
              {t("about.missionP1")}
            </motion.p>
            <motion.p variants={fadeUp} className="text-dark/55 text-sm leading-relaxed">
              {t("about.missionP2")}
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
              {t("about.ourValues")}
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-dark mb-12 tracking-tight">
              {t("about.valuesHeadline")}
            </motion.h2>
          </Section>

          <Section className="grid md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, titleKey, bodyKey }) => (
              <motion.div
                key={titleKey}
                variants={fadeUp}
                className="bg-light rounded-3xl p-7 flex flex-col gap-4 shadow-sm shadow-dark/5"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icon size={20} className="text-primary" strokeWidth={1.7} />
                </div>
                <h3 className="text-base font-bold text-dark">{t(titleKey)}</h3>
                <p className="text-sm text-dark/55 leading-relaxed">{t(bodyKey)}</p>
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <section className="bg-primary py-12 px-6 md:px-14">
        <Section className="max-w-[1400px] mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { num: "5+",     labelKey: "about.stat1" },
            { num: "2,000+", labelKey: "about.stat2" },
            { num: "30+",    labelKey: "about.stat3" },
          ].map(({ num, labelKey }) => (
            <motion.div key={labelKey} variants={fadeUp}>
              <p className="text-3xl md:text-4xl font-bold text-light tabular-nums">{num}</p>
              <p className="text-xs md:text-sm text-light/55 mt-1 font-medium">{t(labelKey)}</p>
            </motion.div>
          ))}
        </Section>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────────── */}
      <section id="contact" className="bg-light py-16 md:py-24 px-6 md:px-14">
        <div className="max-w-[1400px] mx-auto">
          <Section>
            <motion.p variants={fadeUp} className="text-secondary text-xs uppercase tracking-[0.2em] font-semibold mb-3">
              {t("about.getInTouch")}
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-dark mb-10 tracking-tight">
              {t("about.contactHeadline")}
            </motion.h2>
          </Section>

          <Section className="grid md:grid-cols-2 gap-10 items-start">
            <div className="flex flex-col gap-5">
              {info.map(({ icon: Icon, labelKey, valueKey, href }) => (
                <motion.div key={labelKey} variants={fadeUp} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-primary" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-xs text-dark/40 font-medium uppercase tracking-wider">{t(labelKey)}</p>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                         className="text-sm font-semibold text-dark mt-0.5 hover:text-primary transition-colors block">
                        {t(valueKey)}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-dark mt-0.5">{t(valueKey)}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              <motion.div variants={fadeUp} className="mt-4 flex gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-primary text-light
                             text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  {t("about.bookNow")}
                </Link>
              </motion.div>
            </div>

            <motion.div variants={fadeUp}>
              <a
                href="https://maps.app.goo.gl/SJCGLfnW1ffE5Bym7"
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-video rounded-3xl overflow-hidden bg-dark/5 group"
              >
                <iframe
                  src="https://maps.google.com/maps?q=Muscat+Oman&output=embed"
                  className="w-full h-full border-0 pointer-events-none"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="WellnessHub location"
                />
                <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/10 transition-colors flex items-end justify-end p-4">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-light/90 backdrop-blur-sm rounded-xl
                                   text-xs font-semibold text-dark shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <MapPin size={12} className="text-primary" />
                    Open in Maps
                  </span>
                </div>
              </a>
            </motion.div>
          </Section>
        </div>
      </section>
    </>
  );
}
