"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export type PosToastKind = "success" | "error" | "info";

interface PosToastItem {
  id: string;
  message: string;
  kind: PosToastKind;
}

export function usePosToast() {
  const [toasts, setToasts] = useState<PosToastItem[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, kind: PosToastKind = "info") => {
    const id = `t-${Date.now()}-${++counterRef.current}`;
    setToasts((p) => [...p, { id, message, kind }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);

  return { showToast, toasts };
}

const KIND_CONFIG: Record<PosToastKind, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: "text-emerald-400" },
  error:   { icon: AlertCircle,  cls: "text-red-400" },
  info:    { icon: Info,         cls: "text-accent" },
};

export function PosToastStack({ toasts }: { toasts: PosToastItem[] }) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const { icon: Icon, cls } = KIND_CONFIG[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.94 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl bg-dark/90 text-light text-sm font-medium backdrop-blur-sm whitespace-nowrap"
            >
              <Icon size={14} className={cls} />
              {t.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
