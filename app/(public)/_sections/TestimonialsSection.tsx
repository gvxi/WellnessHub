"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useLang } from "@/lib/lang-context";

type TestimonialItem = { name: string; role: string; rating: number; text: string };

const EN_ITEMS: TestimonialItem[] = [
  { name: "Sara Al Habsi",      role: "Yoga Instructor",    rating: 5, text: "The best wellness experience in Muscat. Every visit feels like a luxury retreat." },
  { name: "Ahmad Al Balushi",   role: "Fitness Coach",      rating: 5, text: "Professional staff and world-class facilities. Highly recommend the advanced skin treatments." },
  { name: "Hessa Al Farsi",     role: "Marketing Director", rating: 5, text: "Finally a place that combines beauty and fitness under one roof. Absolutely love it!" },
  { name: "Mohammed Al Kindi",  role: "Entrepreneur",       rating: 5, text: "The massage therapy sessions are exceptional. Incredibly skilled therapists." },
  { name: "Fatima Al Rashdi",   role: "Teacher",            rating: 5, text: "WellnessHub has transformed my self-care routine. The team is warm and professional." },
];

const AR_ITEMS: TestimonialItem[] = [
  { name: "سارة الحبسية",   role: "مدربة يوغا",         rating: 5, text: "أفضل تجربة عافية في مسقط. كل زيارة تشعرك وكأنها منتجع فاخر." },
  { name: "أحمد البلوشي",  role: "مدرب لياقة بدنية",  rating: 5, text: "كادر محترف ومرافق عالمية المستوى. أنصح بشدة بعلاجات البشرة المتقدمة." },
  { name: "حصة الفارسية",  role: "مديرة تسويق",        rating: 5, text: "أخيراً مكان يجمع الجمال واللياقة تحت سقف واحد. أحبه كثيراً!" },
  { name: "محمد الكندي",   role: "رجل أعمال",           rating: 5, text: "جلسات التدليك استثنائية. معالجون بمهارة عالية جداً." },
  { name: "فاطمة الرشدية", role: "معلمة",               rating: 5, text: "ويلنس هب غيّرت روتين العناية بنفسي. الفريق دافئ ومحترف." },
];

const avatarStyles = [
  { bg: "bg-primary/15",  text: "text-primary",   ring: "ring-primary/20"   },
  { bg: "bg-secondary/15",text: "text-secondary",  ring: "ring-secondary/20" },
  { bg: "bg-accent/25",   text: "text-secondary",  ring: "ring-accent/30"    },
  { bg: "bg-primary/10",  text: "text-primary",    ring: "ring-primary/15"   },
  { bg: "bg-secondary/20",text: "text-secondary",  ring: "ring-secondary/25" },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

function TestimonialCard({ item, i }: { item: TestimonialItem; i: number }) {
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

export default function TestimonialsSection() {
  const { t, lang } = useLang();
  const items = lang === "ar" ? AR_ITEMS : EN_ITEMS;
  const doubled = [...items, ...items];

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
          {t("testimonials.headline")}
        </h2>
        <p className="text-dark/45 text-sm">
          {t("testimonials.reviewCount").replace("{n}", String(items.length * 1247))}
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
