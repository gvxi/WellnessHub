"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Layers, Megaphone, BarChart2, Settings, LogOut, X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminTab } from "../page";

const DRAWER_LINKS: { tab: AdminTab; icon: typeof CalendarDays; label: string }[] = [
  { tab: "bookings", icon: CalendarDays, label: "Bookings" },
  { tab: "services", icon: Layers, label: "Services" },
  { tab: "ads", icon: Megaphone, label: "Ads" },
  { tab: "analytics", icon: BarChart2, label: "Analytics" },
  { tab: "settings", icon: Settings, label: "Settings" },
];

interface Props {
  open: boolean;
  activeTab: AdminTab;
  onClose: () => void;
  onTabChange: (tab: AdminTab) => void;
}

export default function SideDrawer({ open, activeTab, onClose, onTabChange }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/zw0");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed inset-y-0 left-0 z-50 w-[78vw] max-w-[300px] bg-light flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-6 border-b border-dark/8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-secondary font-medium">Admin Panel</p>
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
              {DRAWER_LINKS.map(({ tab, icon: Icon, label }) => (
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
                  {label}
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
                Sign out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
