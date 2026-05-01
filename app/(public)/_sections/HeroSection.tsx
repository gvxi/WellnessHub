"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { useLang } from "@/lib/lang-context";

const HERO_BG =
  "https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1920";
const PILL_IMG =
  "https://images.unsplash.com/photo-1630595271375-5073a6c0638b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
  },
};

function MagneticButton({ children, className, href }: { children: React.ReactNode; className: string; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  function onMouseMove(e: React.MouseEvent) {
    const rect = ref.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.25);
    y.set((e.clientY - cy) * 0.25);
  }

  function onMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileTap={{ scale: 0.96 }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export default function HeroSection() {
  const { t, lang } = useLang();

  const stats = lang === "ar"
    ? [
        { v: "٢٠٠+",    l: t("hero.stat1") },
        { v: "١٤,٨٧٣", l: t("hero.stat2") },
        { v: "٩٧.٤٪",  l: t("hero.stat3") },
      ]
    : [
        { v: "200+",    l: t("hero.stat1") },
        { v: "14,873",  l: t("hero.stat2") },
        { v: "97.4%",   l: t("hero.stat3") },
      ];

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden" id="hero">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          filter: "contrast(1.1) saturate(0.75)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-dark/70 via-dark/50 to-dark/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(90,15,27,0.25),transparent)]" />

      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center px-5 max-w-5xl mx-auto"
      >
        <motion.div
          variants={itemVariants}
          className="mb-10 inline-flex items-center gap-2.5 px-5 py-2 rounded-full
                     border border-accent/30 bg-light/8 backdrop-blur-md text-accent text-sm font-medium
                     shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" />
          {t("hero.badge")}
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-[clamp(3.2rem,7vw,6rem)] font-extrabold tracking-tighter leading-[1.05]
                     text-light mb-7 w-full"
        >
          {t("hero.headline_1")}{" "}
          <span
            className="inline-block w-[4.5rem] h-[2.8rem] rounded-2xl align-middle bg-cover bg-center mx-2
                       border border-white/20 shadow-md"
            style={{ backgroundImage: `url(${PILL_IMG})`, filter: "saturate(0.8)" }}
          />
          {" "}{t("hero.headline_2")}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-base md:text-lg text-light/65 leading-loose max-w-[52ch] mb-12"
        >
          {t("hero.subheading")}
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
          <MagneticButton
            href="#book"
            className="bg-primary text-light font-bold px-9 py-4 rounded-2xl text-base
                       hover:bg-primary/90 transition-colors duration-200 shadow-[0_8px_32px_rgba(90,15,27,0.5)]
                       border border-primary/50"
          >
            {t("hero.cta_primary")}
          </MagneticButton>
          <MagneticButton
            href="#services"
            className="border border-light/25 text-light font-medium px-9 py-4 rounded-2xl text-base
                       hover:bg-light/10 transition-colors duration-200 backdrop-blur-sm"
          >
            {t("hero.cta_secondary")}
          </MagneticButton>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-14 flex items-center gap-8 flex-wrap justify-center"
        >
          {stats.map((s) => (
            <div key={s.l} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-light/90">{s.v}</span>
              <span className="text-xs text-light/45 tracking-wide">{s.l}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-light to-transparent z-10" />
    </section>
  );
}
