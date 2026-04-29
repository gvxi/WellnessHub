"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import ar from "@/messages/ar.json";

const items = ar.testimonials.items;
const doubled = [...items, ...items];

const avatarStyles = [
  { bg: "bg-primary/15", text: "text-primary", ring: "ring-primary/20" },
  { bg: "bg-secondary/15", text: "text-secondary", ring: "ring-secondary/20" },
  { bg: "bg-accent/25", text: "text-secondary", ring: "ring-accent/30" },
  { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/15" },
  { bg: "bg-secondary/20", text: "text-secondary", ring: "ring-secondary/25" },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-32 md:py-48 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
        className="text-center mb-16 px-5"
      >
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-dark leading-tight mb-3">
          {ar.testimonials.headline}
        </h2>
        <p className="text-dark/45 text-sm">
          بناءً على {items.length * 1247} تقييم موثّق
        </p>
      </motion.div>

      {/* Row 1 — forward */}
      <div className="relative mb-4 select-none">
        <div className="absolute inset-y-0 start-0 w-20 z-10 bg-gradient-to-e from-light to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 end-0 w-20 z-10 bg-gradient-to-s from-light to-transparent pointer-events-none" />
        <motion.div
          className="flex gap-4 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        >
          {doubled.map((item, i) => (
            <TestimonialCard key={i} item={item} i={i} />
          ))}
        </motion.div>
      </div>

      {/* Row 2 — reverse */}
      <div className="relative select-none">
        <div className="absolute inset-y-0 start-0 w-20 z-10 bg-gradient-to-e from-light to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 end-0 w-20 z-10 bg-gradient-to-s from-light to-transparent pointer-events-none" />
        <motion.div
          className="flex gap-4 w-max"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 35, ease: "linear", repeat: Infinity }}
        >
          {doubled.map((item, i) => (
            <TestimonialCard key={i} item={item} i={(i + 2) % 5} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({
  item,
  i,
}: {
  item: (typeof ar.testimonials.items)[number];
  i: number;
}) {
  const style = avatarStyles[i % avatarStyles.length];
  return (
    <div
      className="w-[300px] flex-shrink-0 bg-white rounded-2xl border border-accent/20 p-5
                 shadow-sm shadow-dark/5 hover:shadow-md hover:shadow-dark/8 transition-shadow duration-300"
    >
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: item.rating }).map((_, j) => (
          <Star key={j} size={13} className="fill-primary text-primary" />
        ))}
      </div>
      <p className="text-dark/70 text-sm leading-relaxed mb-5 line-clamp-3">{item.text}</p>
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold
                      ring-2 ring-offset-1 ${style.bg} ${style.text} ${style.ring}`}
        >
          {initials(item.name)}
        </div>
        <div>
          <p className="text-dark text-sm font-semibold leading-none mb-0.5">{item.name}</p>
          <p className="text-dark/40 text-xs">{item.role}</p>
        </div>
      </div>
    </div>
  );
}
