"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Layers, Megaphone, BarChart2, Settings, LogOut, X, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { AdminTab } from "../page";

interface Props {
  open: boolean;
  activeTab: AdminTab;
  onClose: () => void;
  onTabChange: (tab: AdminTab) => void;
}

export default function SideDrawer({ open, activeTab, onClose, onTabChange }: Props) {
  const router = useRouter();
  const { t, isRTL } = useLang();

  const DRAWER_LINKS: { tab: AdminTab; icon: typeof CalendarDays; labelKey: string }[] = [
    { tab: "bookings",  icon: CalendarDays, labelKey: "admin.tab_bookings" },
    { tab: "services",  icon: Layers,       labelKey: "admin.tab_services" },
    { tab: "ads",       icon: Megaphone,    labelKey: "admin.tab_ads" },
    { tab: "analytics", icon: BarChart2,    labelKey: "admin.tab_analytics" },
    { tab: "team",      icon: Users,        labelKey: "admin.tab_team" },
    { tab: "settings",  icon: Settings,     labelKey: "admin.tab_settings" },
  ];

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/zw0");
  }

  // RTL: drawer slides from right; LTR: from left
  const drawerSide = isRTL
    ? "fixed inset-y-0 right-0 z-50 w-[78vw] max-w-[300px] bg-light flex flex-col shadow-2xl"
    : "fixed inset-y-0 left-0 z-50 w-[78vw] max-w-[300px] bg-light flex flex-col shadow-2xl";
  const initial = isRTL ? { x: "100%" } : { x: "-100%" };
  const exit    = isRTL ? { x: "100%" } : { x: "-100%" };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm"
          />

          <motion.aside
            key="sd-panel"
            initial={initial}
            animate={{ x: 0 }}
            exit={exit}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className={drawerSide}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-6 border-b border-dark/8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-secondary font-medium">
                  {t("admin.panel")}
                </p>
                <h2 className="text-lg font-bold text-dark tracking-tight">WellnessHub</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-dark/6 flex items-center justify-center"
              >
                <X size={14} className="text-dark/60" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              {DRAWER_LINKS.map(({ tab, icon: Icon, labelKey }) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium mb-1 transition-colors",
                    activeTab === tab
                      ? "bg-primary/8 text-primary"
                      : "text-dark/60 hover:bg-dark/4"
                  )}
                >
                  <Icon size={17} />
                  {t(labelKey)}
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-8 pt-2 border-t border-dark/8">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-500/80 hover:bg-red-50 transition-colors"
              >
                <LogOut size={17} />
                {t("admin.signOut")}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
