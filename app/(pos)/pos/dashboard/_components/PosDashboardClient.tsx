"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Menu, Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import PosBottomNav from "./PosBottomNav";
import PosSideDrawer from "./PosSideDrawer";
import PosBookingsTab from "../_sections/PosBookingsTab";
import PosServicesTab from "../_sections/PosServicesTab";
import PosAdsTab from "../_sections/PosAdsTab";
import PosAnalyticsTab from "../_sections/PosAnalyticsTab";
import PosSettingsTab from "../_sections/PosSettingsTab";
import PosAboutEditTab from "../_sections/PosAboutEditTab";
import PosTeamTab from "../_sections/PosTeamTab";
import { useLang } from "@/lib/lang-context";
import type { EmployeePermissions, TabPermission } from "@/lib/supabase/types";

export type PosTab = "bookings" | "services" | "ads" | "analytics" | "settings" | "about" | "team";

const ALL_TABS: PosTab[] = ["bookings", "services", "ads", "analytics", "settings", "about", "team"];
const SLIDE = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };
const POS_STORAGE_KEY = "pos_pos_mode";

interface Props {
  permissions: EmployeePermissions;
  employeeEmail?: string;
  parentFullName?: string | null;
}

function PosDashboardInner({ permissions, employeeEmail, parentFullName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang, setLang, isRTL } = useLang();

  const visibleTabs = ALL_TABS.filter((tab) => {
    if (tab === "team") return permissions.pos_user_type === "main" && permissions.can_create_sub_users;
    return (permissions[`tab_${tab}` as keyof EmployeePermissions] as TabPermission) !== "hidden";
  });

  const defaultTab = visibleTabs[0] ?? "bookings";

  const initialTab = (() => {
    const p = searchParams.get("tab") as PosTab | null;
    return p && visibleTabs.includes(p) ? p : defaultTab;
  })();

  const [activeTab, setActiveTab] = useState<PosTab>(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [returnCover, setReturnCover] = useState<string | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function handleTabChange(tab: PosTab) {
    setActiveTab(tab);
    setDrawerOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // Extend session every 25 min
  useEffect(() => {
    async function extend() {
      const res = await fetch("/api/pos/auth", { method: "PUT" });
      if (res.status === 401) {
        await fetch("/api/pos/auth", { method: "DELETE" });
        router.push("/pos");
      }
    }
    extend();
    const id = setInterval(extend, 25 * 60 * 1000);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); }, []);

  async function handleLogout() {
    await fetch("/api/pos/auth", { method: "DELETE" });
    router.push("/pos");
  }

  function handleEnterPos(origin: { x: number; y: number }) {
    setRipple(origin);
    try { sessionStorage.setItem("pos_enter_origin", JSON.stringify(origin)); } catch {}
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => {
      localStorage.setItem(POS_STORAGE_KEY, "true");
      router.push("/pos/posmode");
    }, 420);
  }

  function handleAddPress() {
    if (permissions.tab_services === "enabled") handleTabChange("services");
    else if (permissions.tab_ads === "enabled") handleTabChange("ads");
  }

  const canAdd = permissions.tab_services === "enabled" || permissions.tab_ads === "enabled";

  const tabPermission = (tab: PosTab): Exclude<TabPermission, "hidden"> => {
    const p = permissions[`tab_${tab}` as keyof EmployeePermissions] as TabPermission;
    return p === "hidden" ? "read-only" : p;
  };

  const TAB_LABELS: Record<PosTab, string> = {
    bookings:  t("admin.tab_bookings"),
    services:  t("admin.tab_services"),
    ads:       t("admin.tab_ads"),
    analytics: t("admin.tab_analytics"),
    settings:  t("admin.tab_settings"),
    about:     t("admin.tab_about"),
    team:      t("admin.tab_team"),
  };

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

      {/* Header */}
      <header className="flex-none bg-light border-b border-dark/6">
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
              POS · {TAB_LABELS[activeTab]}
            </span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")} aria-label="Switch language"
              className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center relative">
              <Globe size={16} className="text-dark/60" />
              <span className="absolute bottom-0.5 end-0.5 text-[7px] font-bold text-primary leading-none bg-light px-0.5 rounded">
                {lang.toUpperCase()}
              </span>
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
            {activeTab === "bookings"  && <PosBookingsTab permissions={permissions} />}
            {activeTab === "services"  && <PosServicesTab permissions={permissions} />}
            {activeTab === "ads"       && <PosAdsTab permissions={permissions} />}
            {activeTab === "analytics" && <PosAnalyticsTab />}
            {activeTab === "settings"  && (
              <PosSettingsTab
                employeeEmail={employeeEmail}
                posUserType={permissions.pos_user_type}
                parentFullName={parentFullName}
              />
            )}
            {activeTab === "about"     && <PosAboutEditTab permissionLevel={tabPermission("about")} />}
            {activeTab === "team"      && <PosTeamTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <motion.div key="pos-bottomnav">
        <PosBottomNav
          activeTab={activeTab}
          visibleTabs={visibleTabs}
          onTabChange={handleTabChange}
          onAddPress={canAdd ? handleAddPress : undefined}
          onEnterPos={handleEnterPos}
        />
      </motion.div>

      {/* Ripple */}
      <AnimatePresence>
        {ripple && (
          <motion.div
            key="pos-ripple"
            className="fixed inset-0 z-[200] pointer-events-none"
            style={{
              background: "var(--color-primary, #5A0F1B)",
              clipPath: `circle(0px at ${ripple.x}px ${ripple.y}px)`,
            }}
            animate={{ clipPath: `circle(200vmax at ${ripple.x}px ${ripple.y}px)` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>

      <PosSideDrawer
        open={drawerOpen}
        activeTab={activeTab}
        visibleTabs={visibleTabs}
        onClose={() => setDrawerOpen(false)}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default function PosDashboardClient({ permissions, employeeEmail, parentFullName }: Props) {
  return (
    <Suspense>
      <PosDashboardInner permissions={permissions} employeeEmail={employeeEmail} parentFullName={parentFullName} />
    </Suspense>
  );
}
