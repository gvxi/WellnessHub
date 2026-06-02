"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Menu, Bell, Globe, Zap } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "./_components/BottomNav";
import PosModeDock from "./_components/PosModeDock";
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
const SLIDE = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };
const POS_STORAGE_KEY = "admin_pos_mode";

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
  const [posMode, setPosMode] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [exitRipple, setExitRipple] = useState<{ x: number; y: number } | null>(null);
  const [returnCover, setReturnCover] = useState<string | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store POS button origin for reverse exit animation
  const posOriginRef = useRef<{ x: number; y: number } | null>(null);
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

  // Return-from-POS: collapse cover from fullscreen back to button origin
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pos_return_origin");
      if (!raw) return;
      const origin = JSON.parse(raw) as { x: number; y: number };
      sessionStorage.removeItem("pos_return_origin");
      setReturnCover(`circle(200vmax at ${origin.x}px ${origin.y}px)`);
      requestAnimationFrame(() =>
        setReturnCover(`circle(0px at ${origin.x}px ${origin.y}px)`)
      );
    } catch {}
  }, []);

  function handleTabChange(tab: AdminTab) {
    setActiveTab(tab);
    setDrawerOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.delete("filter");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleEnterPos(origin: { x: number; y: number }) {
    posOriginRef.current = origin;
    setRipple(origin);
    // Persist origin so /zw0/pos can play the reverse animation
    try { sessionStorage.setItem("pos_enter_origin", JSON.stringify(origin)); } catch {}
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => {
      localStorage.setItem(POS_STORAGE_KEY, "true");
      router.push("/zw0/pos");
    }, 420);
  }

  function handleExitPos() {
    // Play reverse ripple from center collapsing to POS button origin
    const origin = posOriginRef.current ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setExitRipple(origin);
    setTimeout(() => {
      setPosMode(false);
      setExitRipple(null);
    }, 500);
  }

  async function handlePosLock() {
    localStorage.setItem(POS_STORAGE_KEY, "true");
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/zw0");
  }

  useEffect(() => () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-light z-50" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Return-from-POS: circle collapses to button origin ── */}
      {returnCover && (
        <motion.div
          className="fixed inset-0 z-[200] pointer-events-none"
          style={{ background: "var(--color-primary, #5A0F1B)" }}
          initial={false}
          animate={{ clipPath: returnCover }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => setReturnCover(null)}
        />
      )}

      {/* ── Header ── */}
      <AnimatePresence initial={false}>
        {!posMode && (
          <motion.header
            key="header"
            className="flex-none bg-light border-b border-dark/6"
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
            transition={SLIDE}
          >
            <div
              className="grid grid-cols-3 items-center px-4 pb-3"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
            >
              <div className="flex">
                <button onClick={() => setDrawerOpen(true)}
                  className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center">
                  <Menu size={18} className="text-dark/70" />
                </button>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Image src="/media/Logo.svg" alt="WellnessHub" width={20} height={20} className="w-5 h-5 object-contain" />
                  <span className="text-sm font-bold text-dark tracking-tight">WellnessHub</span>
                </div>
                <span className="text-[8px] uppercase tracking-[0.15em] font-semibold text-secondary/70">
                  {t("admin.badge")} · {TAB_LABELS[activeTab]}
                </span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <button onClick={() => setActionsOpen(true)} aria-label="Admin actions"
                  className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center">
                  <Zap size={16} className="text-dark/60" />
                </button>
                <button onClick={() => setLang(lang === "en" ? "ar" : "en")} aria-label="Switch language"
                  className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center relative">
                  <Globe size={16} className="text-dark/60" />
                  <span className="absolute bottom-0.5 end-0.5 text-[7px] font-bold text-primary leading-none bg-light px-0.5 rounded">
                    {lang.toUpperCase()}
                  </span>
                </button>
                <button onClick={() => setAlertsOpen(true)}
                  className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center relative">
                  <Bell size={18} className="text-dark/70" />
                  {unseenCount > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 rounded-full bg-primary text-light text-[9px] font-bold flex items-center justify-center px-0.5 tabular-nums">
                      {unseenCount > 9 ? "9+" : unseenCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── Tab content ── */}
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

      {/* ── Bottom nav ── */}
      <AnimatePresence initial={false}>
        {!posMode && (
          <motion.div
            key="bottomnav"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={SLIDE}
          >
            <BottomNav
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onAddPress={() => setAddSheetOpen(true)}
              onEnterPos={handleEnterPos}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {posMode && (
        <PosModeDock onExit={handleExitPos} onLock={handlePosLock} />
      )}

      {/* ── Exit ripple (reverse: fullscreen → point) ── */}
      <AnimatePresence>
        {exitRipple && (
          <motion.div
            key="exit-ripple"
            className="fixed inset-0 z-[200] pointer-events-none"
            style={{ background: "var(--color-primary, #5A0F1B)" }}
            initial={{ clipPath: `circle(200vmax at ${exitRipple.x}px ${exitRipple.y}px)` }}
            animate={{ clipPath: `circle(0px at ${exitRipple.x}px ${exitRipple.y}px)` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ── Circular POS mode ripple ── */}
      <AnimatePresence>
        {ripple && (
          <motion.div
            key="pos-ripple"
            className="fixed inset-0 z-[200] pointer-events-none"
            style={{
              background: "var(--color-primary, #5A0F1B)",
              clipPath: `circle(0px at ${ripple.x}px ${ripple.y}px)`,
            }}
            animate={{
              clipPath: `circle(200vmax at ${ripple.x}px ${ripple.y}px)`,
            }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>

      <SideDrawer   open={drawerOpen}  activeTab={activeTab} onClose={() => setDrawerOpen(false)} onTabChange={handleTabChange} />
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
