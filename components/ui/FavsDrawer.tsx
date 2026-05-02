"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { useCart, useFavs, useUI } from "@/lib/shop-context";
import { useToast } from "@/lib/toast-context";
import { useLang } from "@/lib/lang-context";
import { resolveImage } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 260, damping: 26 };

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FavsDrawer({ open, onClose }: Props) {
  const { favItems, ids, toggle } = useFavs();
  const { addItem, isInCart } = useCart();
  const { setSelectedItem } = useUI();
  const { showToast } = useToast();
  const { t } = useLang();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="favs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="favs-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING}
            drag="x"
            dragConstraints={{ left: 0, right: 400 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80 || info.velocity.x > 500) onClose();
            }}
            style={{ willChange: "transform" }}
            className="fixed z-50 right-0 top-0 bottom-0 bg-light flex flex-col
                       w-full max-w-[420px] rounded-l-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-dark/8 shrink-0">
              <div className="flex items-center gap-2.5">
                <Heart size={18} className="text-secondary fill-secondary" />
                <h2 className="text-base font-bold text-dark">{t("favs.title")}</h2>
                {ids.size > 0 && (
                  <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full tabular-nums">
                    {ids.size}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close favorites"
                className="w-9 h-9 rounded-full flex items-center justify-center
                           hover:bg-dark/8 transition-colors text-dark/50 hover:text-dark"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {favItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-dark/5 flex items-center justify-center">
                    <Heart size={28} className="text-dark/20" />
                  </div>
                  <p className="text-sm text-dark/40 font-medium">{t("favs.empty")}</p>
                  <p className="text-xs text-dark/30">{t("favs.emptyHint")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {favItems.map((info) => (
                      <motion.div
                        key={info.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40, scale: 0.95 }}
                        transition={{ duration: 0.22 }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-dark/[0.03] hover:bg-dark/[0.05] transition-colors cursor-pointer"
                        onClick={() => { setSelectedItem(info); onClose(); }}
                      >
                        {resolveImage(info.imageUrl, info.unsplashId, 120) && (
                          <img
                            src={resolveImage(info.imageUrl, info.unsplashId, 120)!}
                            alt={info.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark truncate">{info.name}</p>
                          <p className="text-xs text-dark/45 tabular-nums">
                            {info.numericPrice ? `${info.numericPrice} OMR` : info.price}
                          </p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.82 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(info);
                            showToast(`${info.name} added to cart`, "cart");
                          }}
                          aria-label="Add to cart"
                          className="w-8 h-8 flex items-center justify-center rounded-xl
                                     text-dark/25 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ShoppingBag size={14} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.82 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(info);
                          }}
                          aria-label="Remove from favorites"
                          className="w-8 h-8 flex items-center justify-center rounded-xl
                                     text-secondary/50 hover:text-secondary hover:bg-secondary/10 transition-colors"
                        >
                          <Heart size={14} className={isInCart(info.id) ? "" : ""} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
