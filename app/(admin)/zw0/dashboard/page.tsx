"use client";

import { useEffect, useState, Suspense } from "react";
import { Menu, Bell, Globe, Zap } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "./_components/BottomNav";
import SideDrawer from "./_components/SideDrawer";
import QuickAddSheet from "./_components/QuickAddSheet";
import AlertsDrawer from "./_components/AlertsDrawer";
import ActionsPanel from "./_components/ActionsPanel";
import BookingsTab from "./_sections/BookingsTab";
import ServicesTab from "./_sections/ServicesTab";
import AdsTab from "./_sections/AdsTab";
import AnalyticsTab from "./_sections/AnalyticsTab";
import SettingsTab from "./_sections/SettingsTab";
import TeamTab from "./_sections/TeamTab";
import AboutEditTab from "./_sections/AboutEditTab";
import { useLang } from "@/lib/lang-context";

export type AdminTab = "bookings" | "services" | "ads" | "analytics" | "settings" | "team" | "about";

const VALID_TABS: AdminTab[] = ["bookings", "services", "ads", "analytics", "settings", "team", "about"];

function DashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = (() => {
    const p = searchParams.get("tab");
    return VALID_TABS.includes(p as AdminTab) ? (p as AdminTab) : "bookings";
  })();

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const { t, lang, setLang, isRTL } = useLang();

  const TAB_LABELS: Record<AdminTab, string> = {
    bookings:  t("admin.tab_bookings"),
    services:  t("admin.tab_services"),
    ads:       t("admin.tab_ads"),
    analytics: t("admin.tab_analytics"),
    settings:  t("admin.tab_settings"),
    team:      t("admin.tab_team"),
    about:     t("admin.tab_about"),
  };

  // Extend session every 25 min; redirect to login on 401
  useEffect(() => {
    async function extend() {
      const res = await fetch("/api/admin/auth", { method: "PUT" });
      if (res.status === 401) {
        await fetch("/api/admin/auth", { method: "DELETE" });
        router.push("/zw0");
      }
    }
    extend();
    const id = setInterval(extend, 25 * 60 * 1000);
    return () => clearInterval(id);
  }, [router]);

  function handleTabChange(tab: AdminTab) {
    setActiveTab(tab);
    setDrawerOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.delete("filter");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    // dir on root — browser handles all RTL flipping for in-flow content
    <div className="fixed inset-0 flex flex-col bg-light z-50" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="flex-none bg-light border-b border-dark/6">
        <div
          className="grid grid-cols-3 items-center px-4 pb-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
        >
          {/* Col 1 — menu (start side; flips to right in RTL automatically via dir) */}
          <div className="flex">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center"
            >
              <Menu size={18} className="text-dark/70" />
            </button>
          </div>

          {/* Col 2 — centered logo + brand */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <Image src="/media/Logo.svg" alt="WellnessHub" width={20} height={20} className="w-5 h-5 object-contain" />
              <span className="text-sm font-bold text-dark tracking-tight">WellnessHub</span>
            </div>
            <span className="text-[8px] uppercase tracking-[0.15em] font-semibold text-secondary/70">
              {t("admin.badge")} · {TAB_LABELS[activeTab]}
            </span>
          </div>

          {/* Col 3 — actions (end side; flips to left in RTL automatically via dir) */}
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => setActionsOpen(true)}
              aria-label="Admin actions"
              className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center"
            >
              <Zap size={16} className="text-dark/60" />
            </button>

            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              aria-label="Switch language"
              className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center relative"
            >
              <Globe size={16} className="text-dark/60" />
              <span className="absolute bottom-0.5 end-0.5 text-[7px] font-bold text-primary leading-none bg-light px-0.5 rounded">
                {lang.toUpperCase()}
              </span>
            </button>

            <button
              onClick={() => setAlertsOpen(true)}
              className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center relative"
            >
              <Bell size={18} className="text-dark/70" />
              {unseenCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 rounded-full bg-primary text-light text-[9px] font-bold flex items-center justify-center px-0.5 tabular-nums">
                  {unseenCount > 9 ? "9+" : unseenCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="h-full"
          >
            {activeTab === "bookings"  && <BookingsTab />}
            {activeTab === "services"  && <ServicesTab />}
            {activeTab === "ads"       && <AdsTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "settings"  && <SettingsTab />}
            {activeTab === "team"      && <TeamTab />}
            {activeTab === "about"     && <AboutEditTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onAddPress={() => setAddSheetOpen(true)} />

      <SideDrawer   open={drawerOpen}  activeTab={activeTab} onClose={() => setDrawerOpen(false)}  onTabChange={handleTabChange} />
      <QuickAddSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} onNavigate={(tab) => { handleTabChange(tab); setAddSheetOpen(false); }} />
      <AlertsDrawer  open={alertsOpen}  onClose={() => setAlertsOpen(false)} onUnseenChange={setUnseenCount} />
      <ActionsPanel  open={actionsOpen} onClose={() => setActionsOpen(false)} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
