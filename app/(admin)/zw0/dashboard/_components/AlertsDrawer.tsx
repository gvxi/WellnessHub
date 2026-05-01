"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Bell, UserPlus, CalendarPlus, Check } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

type AlertType = "signup" | "booking_new" | "booking_approved" | "booking_rejected" | string;

type Alert = {
  id: string;
  type: AlertType;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  seen: boolean;
  created_at: string;
};

const SPRING = { type: "spring" as const, stiffness: 340, damping: 34 };

function alertIcon(type: AlertType) {
  if (type === "signup") return <UserPlus size={15} className="text-secondary" />;
  if (type.startsWith("booking")) return <CalendarPlus size={15} className="text-primary" />;
  return <Bell size={15} className="text-dark/50" />;
}

function alertIconBg(type: AlertType) {
  if (type === "signup") return "bg-secondary/10";
  if (type.startsWith("booking")) return "bg-primary/10";
  return "bg-dark/6";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onUnseenChange: (count: number) => void;
}

export default function AlertsDrawer({ open, onClose, onUnseenChange }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const { t, isRTL } = useLang();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/admin/alerts").then((r) => r.json());
      if (Array.isArray(data)) {
        setAlerts(data);
        onUnseenChange(data.filter((a: Alert) => !a.seen).length);
      }
    } finally {
      setLoading(false);
    }
  }, [onUnseenChange]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!open) return;
    const unseen = alerts.filter((a) => !a.seen).map((a) => a.id);
    if (unseen.length === 0) return;
    fetch("/api/admin/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unseen }),
    }).then(() => {
      setAlerts((prev) => prev.map((a) => ({ ...a, seen: true })));
      onUnseenChange(0);
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // RTL: alerts drawer slides from left; LTR: from right
  const panelSide = isRTL
    ? "fixed top-0 left-0 bottom-0 z-[70] w-full max-w-[340px] bg-light shadow-2xl flex flex-col"
    : "fixed top-0 right-0 bottom-0 z-[70] w-full max-w-[340px] bg-light shadow-2xl flex flex-col";
  const initial = isRTL ? { x: "-100%" } : { x: "100%" };
  const exit    = isRTL ? { x: "-100%" } : { x: "100%" };

  function markAllSeen() {
    fetch("/api/admin/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setAlerts((prev) => prev.map((a) => ({ ...a, seen: true })));
    onUnseenChange(0);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="alerts-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-dark/40 backdrop-blur-sm"
          />
          <motion.div
            key="alerts-panel"
            initial={initial}
            animate={{ x: 0 }}
            exit={exit}
            transition={SPRING}
            className={panelSide}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-dark/6">
              <div>
                <h2 className="text-base font-semibold text-dark">{t("admin.alerts")}</h2>
                <p className="text-xs text-dark/40 mt-0.5">{t("admin.alertsSubtitle")}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-dark/6 flex items-center justify-center"
              >
                <X size={14} className="text-dark/60" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-3">
              {loading && alerts.length === 0 ? (
                <div className="flex flex-col gap-2 px-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-2xl bg-dark/4 animate-pulse" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-dark/5 flex items-center justify-center mb-3">
                    <Bell size={22} className="text-dark/20" />
                  </div>
                  <p className="text-sm text-dark/40 font-medium">{t("admin.alertsEmpty")}</p>
                  <p className="text-xs text-dark/25 mt-1">{t("admin.alertsEmptyHint")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1 px-3">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex items-start gap-3 px-3 py-3 rounded-2xl transition-colors",
                        alert.seen ? "bg-transparent" : "bg-primary/[0.04]"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", alertIconBg(alert.type))}>
                        {alertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-dark leading-tight">{alert.title}</p>
                          {alert.seen && <Check size={11} className="text-dark/20 shrink-0" />}
                        </div>
                        {alert.body && (
                          <p className="text-xs text-dark/50 mt-0.5 leading-relaxed">{alert.body}</p>
                        )}
                        <p className="text-[10px] text-dark/30 mt-1">{timeAgo(alert.created_at)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="px-4 py-3 border-t border-dark/6">
                <button
                  onClick={markAllSeen}
                  className="w-full py-2.5 rounded-2xl text-xs font-medium text-dark/40 hover:text-dark/60 hover:bg-dark/4 transition-colors"
                >
                  {t("admin.markAllSeen")}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
