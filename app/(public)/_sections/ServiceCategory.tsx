"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { useRef } from "react";
import type { Category, ServiceItem } from "@/lib/services-data";
import { useCart, useFavs, useUI, registerItem } from "@/lib/shop-context";
import { cn, resolveImage } from "@/lib/utils";
import { PACKAGE_ICONS } from "@/lib/package-icons";
import { useLang } from "@/lib/lang-context";

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

function Banner({ category }: { category: Category }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const title = (isAr && category.titleAr) ? category.titleAr : category.title;
  const subtitle = (isAr && category.subtitleAr) ? category.subtitleAr : category.subtitle;

  return (
    <div className="relative w-full min-h-[340px] md:min-h-[420px] overflow-hidden flex items-end">
      <motion.div
        initial={{ scale: 1.06 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="absolute inset-0 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url(${resolveImage(category.imageUrl, category.unsplashId, 1600) ?? ""})`,
          filter: "saturate(0.8) contrast(1.05)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-dark/88 via-dark/30 to-dark/10" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="relative z-10 px-6 md:px-14 pb-10 md:pb-14"
        dir={isAr ? "rtl" : "ltr"}
      >
        <p className="text-accent/80 text-xs uppercase tracking-[0.2em] font-medium mb-2">
          {subtitle}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-light tracking-tight leading-tight">
          {title}
        </h2>
      </motion.div>
    </div>
  );
}

function ItemIndicators({ itemId }: { itemId: string }) {
  const { isInCart } = useCart();
  const { isFav } = useFavs();
  const inCart = isInCart(itemId);
  const inFavs = isFav(itemId);

  return (
    <div className="flex items-center gap-1 shrink-0">
      <AnimatePresence>
        {inFavs && (
          <motion.span
            key="fav-indicator"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="w-5 h-5 rounded-full bg-secondary/15 flex items-center justify-center"
          >
            <Heart size={10} className="fill-secondary text-secondary" />
          </motion.span>
        )}
        {inCart && (
          <motion.span
            key="cart-indicator"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="w-5 h-5 rounded-full bg-primary/12 flex items-center justify-center"
          >
            <ShoppingBag size={10} className="text-primary" />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceRow({ item }: { item: ServiceItem }) {
  const { setSelectedItem } = useUI();
  const { lang } = useLang();
  const isAr = lang === "ar";
  registerItem(item);

  const displayName = (isAr && item.nameAr) ? item.nameAr : item.name;

  return (
    <motion.button
      key={item.id}
      onClick={() => setSelectedItem(item)}
      whileHover={{ backgroundColor: "rgba(14,11,13,0.028)" }}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left transition-colors rounded-xl -mx-2 px-2"
    >
      {item.tiers ? (
        <div className="py-3 border-b border-dark/6 last:border-0" dir={isAr ? "rtl" : "ltr"}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-dark/80">{displayName}</p>
            <ItemIndicators itemId={item.id} />
          </div>
          {item.tiers.map((tier, j) => (
            <div key={j} className="flex justify-between items-center py-1 ps-3">
              <span className="text-sm text-dark/55">
                {(isAr && tier.labelAr) ? tier.labelAr : tier.label}
              </span>
              <span className="text-sm font-semibold text-dark tabular-nums">{tier.price}</span>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex justify-between items-center py-3 border-b border-dark/6 last:border-0 gap-3"
          dir={isAr ? "rtl" : "ltr"}
        >
          <span className="text-sm text-dark/80">
            {item.icon && PACKAGE_ICONS[item.icon as keyof typeof PACKAGE_ICONS]?.emoji + " "}
            {displayName}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <ItemIndicators itemId={item.id} />
            <span className="text-sm font-semibold text-dark tabular-nums whitespace-nowrap">
              {item.price}
            </span>
          </div>
        </div>
      )}
    </motion.button>
  );
}

function PriceList({ category }: { category: Category }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { lang } = useLang();
  const isAr = lang === "ar";

  return (
    <div className="bg-light py-14 md:py-20 px-5 md:px-14 max-w-[1400px] mx-auto w-full">
      <motion.div
        ref={ref}
        variants={listVariants}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="grid md:grid-cols-2 gap-x-16 gap-y-12"
      >
        {category.subs.map((sub) => (
          <motion.div key={sub.title} variants={rowVariants}>
            <h3 className="text-[10px] uppercase tracking-[0.22em] font-semibold text-secondary mb-4 pb-2 border-b border-dark/8">
              {(isAr && sub.titleAr) ? sub.titleAr : sub.title}
            </h3>
            {sub.note && (
              <p className="text-xs text-dark/40 italic mb-3">{sub.note}</p>
            )}
            <div className="flex flex-col gap-0">
              {sub.items.map((item) => (
                <ServiceRow key={item.id} item={item} />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default function ServiceCategory({ category }: { category: Category }) {
  return (
    <section id={category.id}>
      <Banner category={category} />
      <PriceList category={category} />
    </section>
  );
}
