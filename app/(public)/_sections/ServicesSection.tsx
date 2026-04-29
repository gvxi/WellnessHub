"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import ar from "@/messages/ar.json";

const IMGS = {
  spa:      "https://images.unsplash.com/photo-1630595632518-8217c0bceb8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  salon:    "https://images.unsplash.com/photo-1712641966810-611ff1503c6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  fitness:  "https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  skincare: "https://images.unsplash.com/photo-1761718209708-9ab9ba1c7252?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  massage:  "https://images.unsplash.com/photo-1542729553-6775aaa1eb3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
};

/* Explicit grid placement — 3 cols x 3 rows = 9 slots, zero gaps
   spa(2x2)=4 + salon(1x1)=1 + fitness(1x1)=1 + skincare(2x1)=2 + massage(1x1)=1 = 9 */
const cards = [
  {
    key: "spa",
    img: IMGS.spa,
    grid: "col-start-1 col-end-3 row-start-1 row-end-3",
    large: true,
  },
  {
    key: "salon",
    img: IMGS.salon,
    grid: "col-start-3 row-start-1",
    large: false,
  },
  {
    key: "fitness",
    img: IMGS.fitness,
    grid: "col-start-3 row-start-2",
    large: false,
  },
  {
    key: "skincare",
    img: IMGS.skincare,
    grid: "col-start-1 col-end-3 row-start-3",
    large: false,
  },
  {
    key: "massage",
    img: IMGS.massage,
    grid: "col-start-3 row-start-3",
    large: false,
  },
] as const;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
  },
};

export default function ServicesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="services" className="py-32 md:py-48 px-5 max-w-[1400px] mx-auto">
      {/* Left-aligned header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
        className="mb-14 max-w-lg"
      >
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-dark leading-tight mb-4">
          {ar.services.section_headline}
        </h2>
        <p className="text-dark/55 text-base leading-relaxed">
          {ar.services.section_sub}
        </p>
      </motion.div>

      {/* Perfect 3x3 bento grid — grid-flow-dense prevents any gaps */}
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="grid grid-cols-3 gap-3 md:gap-4"
        style={{ gridTemplateRows: "repeat(3, clamp(180px, 22vw, 320px))" }}
      >
        {cards.map((card) => {
          const svc = ar.services[card.key];
          return (
            <motion.div
              key={card.key}
              variants={cardVariants}
              className={`group relative overflow-hidden rounded-2xl md:rounded-3xl cursor-pointer ${card.grid}`}
            >
              {/* Image — scale on hover */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out
                           group-hover:scale-[1.06] will-change-transform"
                style={{
                  backgroundImage: `url(${card.img})`,
                  filter: "saturate(0.82) contrast(1.05)",
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/85 via-dark/20 to-transparent" />
              {/* Hover tint */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/15 transition-colors duration-500" />

              {/* Text */}
              <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
                <h3 className={`text-light font-bold leading-snug mb-1 ${card.large ? "text-xl md:text-2xl" : "text-sm md:text-base"}`}>
                  {svc.title}
                </h3>
                <p className={`text-light/60 leading-relaxed ${card.large ? "text-sm" : "text-xs"} hidden sm:block`}>
                  {svc.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
