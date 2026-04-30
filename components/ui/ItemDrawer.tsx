"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart, useFavs } from "@/lib/shop-context";
import { useToast } from "@/lib/toast-context";
import type { ServiceItem } from "@/lib/services-data";
import { cn } from "@/lib/utils";

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
  const [qty, setQty] = useState(1);
  const isDesktop = useIsDesktop();

  useEffect(() => { setQty(1); }, [item]);

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
    addItem(item, qty);
    showToast(`${item.name} added to cart`, "cart");
    onClose();
  }

  function handleToggleFav() {
    if (!item) return;
    const wasFav = isFav(item.id);
    toggle(item);
    showToast(wasFav ? "Removed from favorites" : `${item.name} saved`, "fav");
  }

  const imageUrl = item?.unsplashId
    ? `https://images.unsplash.com/${item.unsplashId}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`
    : null;

  const panelVariants = {
    hidden: isDesktop ? { x: "100%" } : { y: "100%" },
    visible: isDesktop ? { x: 0 } : { y: 0 },
    exit: isDesktop ? { x: "100%" } : { y: "100%" },
  };

  const panelClass = isDesktop
    ? "fixed z-50 bg-light flex flex-col overflow-hidden right-0 top-0 bottom-0 rounded-l-3xl w-[min(33vw,440px)]"
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
          >
            {imageUrl && (
              <div className="relative w-full h-[220px] shrink-0">
                <img
                  src={imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-light/70 to-transparent" />
              </div>
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-dark/25 backdrop-blur-sm
                         flex items-center justify-center text-light hover:bg-dark/40 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col flex-1 overflow-y-auto px-6 pt-5 pb-8 gap-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-dark leading-snug flex-1">{item.name}</h2>
                <motion.button
                  onClick={handleToggleFav}
                  whileTap={{ scale: 0.82 }}
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                             hover:bg-secondary/10 transition-colors"
                  aria-label={isFav(item.id) ? "Remove from favorites" : "Save to favorites"}
                >
                  <Heart
                    size={20}
                    className={cn(
                      "transition-colors duration-200",
                      isFav(item.id) ? "fill-secondary text-secondary" : "text-dark/30"
                    )}
                  />
                </motion.button>
              </div>

              {item.description && (
                <p className="text-sm text-dark/60 leading-relaxed">{item.description}</p>
              )}

              <div className="flex flex-col gap-1">
                {item.tiers ? (
                  item.tiers.map((tier) => (
                    <div
                      key={tier.label}
                      className="flex justify-between items-center py-2 border-b border-dark/6 last:border-0"
                    >
                      <span className="text-sm text-dark/55">{tier.label}</span>
                      <span className="text-sm font-semibold text-dark tabular-nums">{tier.price}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark/55">Price</span>
                    <span className="text-lg font-bold text-dark tabular-nums">{item.price}</span>
                  </div>
                )}
              </div>

              {item.note && (
                <p className="text-xs text-dark/40 italic">{item.note}</p>
              )}

              <div className="flex items-center gap-4 pt-1">
                <span className="text-sm font-medium text-dark/70">Qty</span>
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

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleAddToCart}
                className={cn(
                  "w-full py-3.5 rounded-2xl text-sm font-semibold transition-colors duration-200",
                  isInCart(item.id)
                    ? "bg-primary/12 text-primary hover:bg-primary/18"
                    : "bg-primary text-light hover:bg-primary/90"
                )}
              >
                {isInCart(item.id) ? "Add More to Cart" : "Add to Cart"}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
