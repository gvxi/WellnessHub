"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

type ActionState = "idle" | "running" | "success" | "error";

interface ActionItem {
  id: string;
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
  endpoint: string;
  destructive?: boolean;
}

const SPRING = { type: "spring" as const, stiffness: 340, damping: 34 };

const ACTIONS: ActionItem[] = [
  {
    id: "clear-pending",
    titleKey: "admin.actions_clear_pending",
    descKey: "admin.actions_clear_pending_desc",
    icon: <Trash2 size={16} />,
    endpoint: "/api/admin/actions/clear-pending",
    destructive: true,
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ActionsPanel({ open, onClose }: Props) {
  const { t, lang } = useLang();
  const isRTL = lang === "ar";
  const [states, setStates] = useState<Record<string, ActionState>>({});
  const [results, setResults] = useState<Record<string, string>>({});

  async function runAction(action: ActionItem) {
    setStates((s) => ({ ...s, [action.id]: "running" }));
    setResults((r) => ({ ...r, [action.id]: "" }));
    try {
      const res = await fetch(action.endpoint, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Unknown error");
      const detail = json.cleared != null ? `${json.cleared} removed` : "";
      setResults((r) => ({ ...r, [action.id]: detail }));
      setStates((s) => ({ ...s, [action.id]: "success" }));
    } catch (err) {
      setResults((r) => ({ ...r, [action.id]: (err as Error).message }));
      setStates((s) => ({ ...s, [action.id]: "error" }));
    }
  }

  function stateLabel(state: ActionState) {
    if (state === "running") return t("admin.actions_running");
    if (state === "success") return t("admin.actions_success");
    if (state === "error")   return t("admin.actions_error");
    return t("admin.actions_run");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="actions-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[59] bg-dark/40"
          />

          <motion.div
            key="actions-panel"
            initial={{ x: isRTL ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "-100%" : "100%" }}
            transition={SPRING}
            className={cn(
              "fixed top-0 bottom-0 z-[60] w-full max-w-[320px] bg-light shadow-2xl flex flex-col",
              isRTL ? "left-0" : "right-0"
            )}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-dark/8 shrink-0">
              <p className="text-base font-bold text-dark">{t("admin.actions_panel_title")}</p>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark/8 transition-colors"
              >
                <X size={16} className="text-dark/50" />
              </button>
            </div>

            {/* Action list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {ACTIONS.map((action) => {
                const state = states[action.id] ?? "idle";
                const result = results[action.id] ?? "";
                const isRunning = state === "running";

                return (
                  <div
                    key={action.id}
                    className="rounded-2xl border border-dark/8 bg-dark/[0.02] p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        action.destructive ? "bg-red-50 text-red-500" : "bg-primary/8 text-primary"
                      )}>
                        {action.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark">{t(action.titleKey)}</p>
                        <p className="text-xs text-dark/45 mt-0.5 leading-relaxed">{t(action.descKey)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {/* Status feedback */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        {state === "success" && (
                          <>
                            <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                            <span className="text-[11px] text-emerald-600 truncate">{result || t("admin.actions_success")}</span>
                          </>
                        )}
                        {state === "error" && (
                          <>
                            <AlertCircle size={12} className="text-red-500 shrink-0" />
                            <span className="text-[11px] text-red-500 truncate">{result || t("admin.actions_error")}</span>
                          </>
                        )}
                      </div>

                      <button
                        disabled={isRunning}
                        onClick={() => runAction(action)}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                          action.destructive
                            ? "bg-red-500 text-white disabled:opacity-50"
                            : "bg-primary text-light disabled:opacity-50"
                        )}
                      >
                        {isRunning && <Loader2 size={11} className="animate-spin" />}
                        {stateLabel(state)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
