"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";

const CTA_BG =
  "https://images.unsplash.com/photo-1630595271375-5073a6c0638b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920";

function MagneticCta({ children, className }: { children: React.ReactNode; className: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 130, damping: 12 });
  const sy = useSpring(y, { stiffness: 130, damping: 12 });

  function onMouseMove(e: React.MouseEvent) {
    const rect = ref.current!.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.2);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.2);
  }
  function onMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.a
      ref={ref}
      href="/register"
      style={{ x: sx, y: sy }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export default function CtaSection() {
  const { t } = useLang();

  const chips = [t("cta.chip1"), t("cta.chip2"), t("cta.chip3")];

  return (
    <>
      {/* CTA Block */}
      <section id="book" className="py-32 md:py-48 px-5 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
          className="relative overflow-hidden rounded-3xl text-center px-8 md:px-20 py-24 md:py-32"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${CTA_BG})`, filter: "saturate(0.7) contrast(1.1)" }}
          />
          <div className="absolute inset-0 bg-primary/88" />
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 130%, #BFA6C9 0%, transparent 60%)" }}
          />
          <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-extrabold text-light tracking-tighter leading-tight mb-5 max-w-2xl">
              {t("cta.headline")}
            </h2>
            <p className="text-light/65 text-base md:text-lg leading-relaxed max-w-[48ch] mb-12">
              {t("cta.sub")}
            </p>
            <MagneticCta
              className="bg-light text-primary font-bold text-base md:text-lg px-10 py-4 rounded-2xl
                         hover:bg-accent transition-colors duration-200 shadow-[0_12px_40px_rgba(0,0,0,0.35)]
                         border border-white/30"
            >
              {t("cta.button")}
            </MagneticCta>

            <div className="mt-8 flex flex-wrap items-center gap-6 justify-center">
              {chips.map((chip) => (
                <span key={chip} className="flex items-center gap-1.5 text-light/50 text-sm">
                  <span className="w-1 h-1 rounded-full bg-accent inline-block" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark/8 px-5 py-14 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="text-primary font-bold text-2xl mb-1 tracking-tight">{t("footer.brand")}</p>
            <p className="text-dark/45 text-sm">{t("footer.tagline")}</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            {[
              { label: t("footer.links_services"), href: "/#services" },
              { label: t("footer.links_about"),    href: "/about"     },
              { label: t("footer.links_privacy"),  href: "/privacy"   },
              { label: t("footer.links_terms"),    href: "/terms"     },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-dark/45 hover:text-primary text-sm transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-dark/6 text-center">
          <p className="text-dark/30 text-xs">{t("footer.copyright")}</p>
        </div>
      </footer>
    </>
  );
}
