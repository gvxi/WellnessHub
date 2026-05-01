"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Layers, Megaphone, FolderPlus } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import type { AdminTab } from "../page";

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: AdminTab) => void;
}

export default function QuickAddSheet({ open, onClose, onNavigate }: Props) {
  const { t } = useLang();

  const ACTIONS = [
    { icon: FolderPlus, labelKey: "admin.new_category", tab: "services" as AdminTab, color: "bg-accent/20 text-secondary" },
    { icon: Layers,     labelKey: "admin.new_service",  tab: "services" as AdminTab, color: "bg-accent/20 text-secondary" },
    { icon: Megaphone,  labelKey: "admin.new_ad",       tab: "ads"      as AdminTab, color: "bg-primary/8 text-primary" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-light rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-dark">{t("admin.quick_add")}</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-dark/6 flex items-center justify-center"
              >
                <X size={13} className="text-dark/60" />
              </button>
            </div>

            <div className="space-y-2">
              {ACTIONS.map(({ icon: Icon, labelKey, tab, color }) => (
                <button
                  key={labelKey}
                  onClick={() => { onNavigate(tab); onClose(); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-dark/[0.03] hover:bg-dark/[0.06] transition-colors text-start"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-medium text-dark">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
