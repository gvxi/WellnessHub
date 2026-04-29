"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const stats = [
  { value: "٢٠٠+", label: "مركز صحي موثوق", sub: "في أرجاء سلطنة عُمان" },
  { value: "١٤,٨٧٣", label: "حجز مكتمل بنجاح", sub: "خلال الأشهر الستة الماضية" },
  { value: "٩٧.٤٪", label: "رضا العملاء", sub: "مبني على ٦,٢٤١ تقييم حقيقي" },
  { value: "٤.٨", label: "متوسط التقييم", sub: "من أصل ٥ نجوم" },
];

const marqueeItems = [
  "سبا نيرفانا",
  "لوتس بيوتي",
  "زن فيتنس",
  "أورا سكين",
  "ريلاكس كلوب",
  "سيرين ويلنس",
  "بيور بلو",
  "لامبدا سبا",
];
const doubledMarquee = [...marqueeItems, ...marqueeItems];

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="bg-dark py-28 md:py-40 overflow-hidden">
      {/* Stats grid */}
      <div className="max-w-[1400px] mx-auto px-5">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8 rounded-3xl overflow-hidden border border-white/8"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
                },
              }}
              className="bg-dark px-6 py-10 md:px-8 md:py-12 flex flex-col gap-2"
            >
              <span className="text-4xl md:text-5xl font-extrabold text-light tracking-tight">
                {s.value}
              </span>
              <span className="text-light/90 text-sm font-semibold">{s.label}</span>
              <span className="text-light/35 text-xs leading-snug">{s.sub}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Marquee of partner brands */}
      <div className="mt-20 relative">
        <div className="absolute inset-y-0 start-0 w-20 z-10 bg-gradient-to-e from-dark to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 end-0 w-20 z-10 bg-gradient-to-s from-dark to-transparent pointer-events-none" />
        <motion.div
          className="flex gap-10 w-max items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, ease: "linear", repeat: Infinity }}
        >
          {doubledMarquee.map((name, i) => (
            <span
              key={i}
              className="text-white/20 text-lg font-bold tracking-widest uppercase whitespace-nowrap select-none"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
