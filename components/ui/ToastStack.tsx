"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { useToast } from "@/lib/toast-context";

export default function ToastStack() {
  const { toasts } = useToast();

  return (
    <div className="fixed z-[100] flex flex-col items-center gap-2 pointer-events-none
                    bottom-24 left-0 right-0
                    md:bottom-auto md:top-6 md:right-6 md:left-auto md:items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg
                       bg-dark/90 text-light text-sm font-medium backdrop-blur-sm
                       max-w-[280px] pointer-events-auto"
          >
            {toast.type === "cart" ? (
              <ShoppingBag size={15} className="text-accent shrink-0" />
            ) : (
              <Heart size={15} className="text-accent fill-accent shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
