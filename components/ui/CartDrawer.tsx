"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useCart, isItemVisible, isRegistryReady } from "@/lib/shop-context";
import { useLang } from "@/lib/lang-context";
import { cn, resolveImage } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 260, damping: 26 };

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQty, clearCart, totalCount } = useCart();
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

  const subtotal = items.reduce((sum, cartItem) => {
    return sum + (cartItem.snapshot.numericPrice ?? 0) * cartItem.qty;
  }, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="cart-panel"
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
                <ShoppingBag size={18} className="text-primary" />
                <h2 className="text-base font-bold text-dark">{t("cart.title")}</h2>
                {totalCount > 0 && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full tabular-nums">
                    {totalCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close cart"
                className="w-9 h-9 rounded-full flex items-center justify-center
                           hover:bg-dark/8 transition-colors text-dark/50 hover:text-dark"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-dark/5 flex items-center justify-center">
                    <ShoppingBag size={28} className="text-dark/20" />
                  </div>
                  <p className="text-sm text-dark/40 font-medium">{t("cart.empty")}</p>
                  <p className="text-xs text-dark/30">{t("cart.emptyHint")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {items.map((cartItem) => {
                      const info = cartItem.snapshot;
                      return (
                        <motion.div
                          key={cartItem.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 40, scale: 0.95 }}
                          transition={{ duration: 0.22 }}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-dark/[0.03] hover:bg-dark/[0.05] transition-colors"
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
                            {isRegistryReady() && !isItemVisible(cartItem.id) ? (
                              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mt-0.5">
                                {t("cart.unavailable")}
                              </p>
                            ) : (
                              <p className="text-xs text-dark/45 tabular-nums">
                                {info.numericPrice ? `${info.numericPrice} OMR` : info.price}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 bg-dark/6 rounded-xl px-1.5 py-1">
                            <motion.button
                              whileTap={{ scale: 0.82 }}
                              onClick={() => updateQty(cartItem.id, cartItem.qty - 1)}
                              disabled={cartItem.qty <= 1}
                              className="w-6 h-6 flex items-center justify-center rounded-lg
                                         text-dark/40 hover:text-dark hover:bg-dark/8 transition-colors
                                         disabled:opacity-25 disabled:cursor-not-allowed"
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </motion.button>
                            <span className="w-4 text-center text-xs font-semibold text-dark tabular-nums">
                              {cartItem.qty}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.82 }}
                              onClick={() => updateQty(cartItem.id, cartItem.qty + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg
                                         text-dark/40 hover:text-dark hover:bg-dark/8 transition-colors"
                            >
                              <Plus size={12} strokeWidth={2.5} />
                            </motion.button>
                          </div>

                          <motion.button
                            whileTap={{ scale: 0.82 }}
                            onClick={() => removeItem(cartItem.id)}
                            aria-label={`Remove ${info.name}`}
                            className="w-8 h-8 flex items-center justify-center rounded-xl
                                       text-dark/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-6 pb-8 pt-4 border-t border-dark/8 flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-dark/55">{t("cart.subtotal")}</span>
                  <span className="text-base font-bold text-dark tabular-nums">
                    {subtotal} OMR
                  </span>
                </div>
                <motion.a
                  href="/checkout"
                  whileTap={{ scale: 0.97 }}
                  className="block w-full py-3.5 rounded-2xl text-sm font-semibold text-center
                             bg-primary text-light hover:bg-primary/90 transition-colors"
                >
                  {t("cart.checkout")}
                </motion.a>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={clearCart}
                  className={cn(
                    "w-full py-3 rounded-2xl text-sm font-medium transition-colors",
                    "text-dark/45 hover:text-dark/70 hover:bg-dark/5"
                  )}
                >
                  {t("cart.clear")}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
