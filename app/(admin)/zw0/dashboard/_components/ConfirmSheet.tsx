"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  message: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function ConfirmSheet({ open, message, onConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try { await onConfirm(); onClose(); }
    finally { setLoading(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-dark/50 backdrop-blur-sm"
          />
          <motion.div
            key="cs-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-[80] bg-light rounded-t-3xl px-5 pt-6 pb-10 shadow-2xl"
          >
            <p className="text-sm text-dark text-center mb-6">{message}</p>
            <button
              disabled={loading}
              onClick={handle}
              className="w-full py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Delete
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 mt-2 text-sm text-dark/45 font-medium"
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
