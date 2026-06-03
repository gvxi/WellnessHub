"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart, useFavs } from "@/lib/shop-context";
import { useToast } from "@/lib/toast-context";
import { useLang } from "@/lib/lang-context";
import type { ServiceItem } from "@/lib/services-data";
import { cn } from "@/lib/utils";
import { playAddToCart } from "@/lib/sounds";

const SPRING = { type: "spring" as const, stiffness: 280, damping: 28 };

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

interface Props {
  item: ServiceItem | null;
  onClose: () => void;
}

export default function ItemDrawer({ item, onClose }: Props) {
  const { addItem, isInCart } = useCart();
  const { toggle, isFav } = useFavs();
  const { showToast } = useToast();
  const { t, lang } = useLang();
  const isAr = lang === "ar";
  const [qty, setQty] = useState(1);
  const [selectedTierIdx, setSelectedTierIdx] = useState(0);
  const isDesktop = useIsDesktop();

  useEffect(() => { setQty(1); setSelectedTierIdx(0); }, [item]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = item ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  function handleAddToCart() {
    if (!item) return;
    if (item.tiers && item.tiers.length > 0) {
      const tier = item.tiers[selectedTierIdx];
      const cartItem = {
        ...item,
        id: `${item.id}::${tier.label}`,
        price: tier.price,
        numericPrice: tier.numericPrice,
        tiers: undefined,
        name: `${item.name} — ${(isAr && tier.labelAr) ? tier.labelAr : tier.label}`,
        nameAr: item.nameAr
          ? `${item.nameAr} — ${tier.labelAr ?? tier.label}`
          : undefined,
      };
      addItem(cartItem, qty);
    } else {
      addItem(item, qty);
    }
    playAddToCart();
    showToast(t("item.addToCart"), "cart");
    onClose();
  }

  function handleToggleFav() {
    if (!item) return;
    const wasFav = isFav(item.id);
    toggle(item);
    showToast(wasFav ? t("favs.empty") : t("item.addToCart"), "fav");
  }

  const displayName = item ? ((isAr && item.nameAr) ? item.nameAr : item.name) : "";
  const displayDesc = item ? ((isAr && item.descriptionAr) ? item.descriptionAr : item.description) : undefined;

  const imageUrl = item?.unsplashId
    ? `https://images.unsplash.com/${item.unsplashId}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`
    : null;

  const desktopHide = isAr ? { x: "-100%" } : { x: "100%" };
  const panelVariants = {
    hidden: isDesktop ? desktopHide : { y: "100%" },
    visible: isDesktop ? { x: 0 } : { y: 0 },
    exit: isDesktop ? desktopHide : { y: "100%" },
  };

  const panelClass = isDesktop
    ? cn("fixed z-50 bg-light flex flex-col overflow-hidden top-0 bottom-0 rounded-l-3xl w-[min(33vw,440px)]", isAr ? "left-0 rounded-l-none rounded-r-3xl" : "right-0")
    : "fixed z-50 bg-light flex flex-col overflow-hidden inset-x-0 bottom-0 rounded-t-3xl max-h-[88vh]";

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={SPRING}
            className={panelClass}
            style={{ willChange: "transform" }}
            dir={isAr ? "rtl" : "ltr"}
          >
            {imageUrl && (
              <div className="relative w-full h-[220px] shrink-0">
                <img
                  src={imageUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-light/70 to-transparent" />
              </div>
            )}

            {imageUrl && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 end-4 z-10 w-9 h-9 rounded-full bg-dark/25 backdrop-blur-sm
                           flex items-center justify-center text-light hover:bg-dark/40 transition-colors"
              >
                <X size={18} />
              </button>
            )}

            <div className="flex flex-col flex-1 overflow-y-auto px-6 pt-5 pb-8 gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {item.groupLabel && (
                    <p className="text-base font-semibold text-secondary mb-0.5">
                      {(isAr && item.groupLabelAr) ? item.groupLabelAr : item.groupLabel}
                    </p>
                  )}
                  <h2 className="text-sm font-medium text-dark/70 leading-snug">{displayName}</h2>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <motion.button
                    onClick={handleToggleFav}
                    whileTap={{ scale: 0.82 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center
                               hover:bg-secondary/10 transition-colors"
                    aria-label={isFav(item.id) ? t("favs.title") : t("item.addToCart")}
                  >
                    <Heart
                      size={20}
                      className={cn(
                        "transition-colors duration-200",
                        isFav(item.id) ? "fill-secondary text-secondary" : "text-dark/30"
                      )}
                    />
                  </motion.button>
                  {!imageUrl && (
                    <button
                      onClick={onClose}
                      aria-label="Close"
                      className="w-10 h-10 rounded-full flex items-center justify-center
                                 text-dark/30 hover:bg-dark/8 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              {displayDesc && (
                <p className="text-sm text-dark/60 leading-relaxed">{displayDesc}</p>
              )}

              <div className="flex flex-col gap-1">
                {item.tiers ? (
                  item.tiers.map((tier, idx) => (
                    <button
                      key={tier.label}
                      onClick={() => setSelectedTierIdx(idx)}
                      className={cn(
                        "flex justify-between items-center py-2.5 px-3 rounded-xl border transition-colors text-start",
                        selectedTierIdx === idx
                          ? "border-primary/30 bg-primary/6"
                          : "border-dark/8 hover:bg-dark/[0.03]"
                      )}
                    >
                      <span className={cn("text-sm", selectedTierIdx === idx ? "font-medium text-dark" : "text-dark/55")}>
                        {(isAr && tier.labelAr) ? tier.labelAr : tier.label}
                      </span>
                      <span className={cn("text-sm font-semibold tabular-nums", selectedTierIdx === idx ? "text-primary" : "text-dark")}>
                        {tier.price}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark/55">{t("item.price")}</span>
                    <span className="text-lg font-bold text-dark tabular-nums">{item.price}</span>
                  </div>
                )}
              </div>

              {item.note && (
                <p className="text-xs text-dark/40 italic">{item.note}</p>
              )}

              <div className="flex items-center gap-4 pt-1">
                <span className="text-sm font-medium text-dark/70">{t("item.qty")}</span>
                <div className="flex items-center gap-3 bg-dark/5 rounded-2xl px-3 py-2">
                  <motion.button
                    whileTap={{ scale: 0.82 }}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded-xl
                               text-dark/50 hover:text-dark hover:bg-dark/8 transition-colors
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </motion.button>
                  <span className="w-5 text-center text-sm font-semibold text-dark tabular-nums">
                    {qty}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.82 }}
                    onClick={() => setQty((q) => q + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-xl
                               text-dark/50 hover:text-dark hover:bg-dark/8 transition-colors"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>

              {(() => {
                const cartId = item.tiers?.length
                  ? `${item.id}::${item.tiers[selectedTierIdx]?.label}`
                  : item.id;
                const inCart = isInCart(cartId);
                return (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleAddToCart}
                    className={cn(
                      "w-full py-3.5 rounded-2xl text-sm font-semibold transition-colors duration-200",
                      inCart
                        ? "bg-primary/12 text-primary hover:bg-primary/18"
                        : "bg-primary text-light hover:bg-primary/90"
                    )}
                  >
                    {inCart ? t("item.addMore") : t("item.addToCart")}
                  </motion.button>
                );
              })()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
