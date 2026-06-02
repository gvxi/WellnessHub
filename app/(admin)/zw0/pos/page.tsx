"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PosModeDock from "../dashboard/_components/PosModeDock";
import BookingsTab from "../dashboard/_sections/BookingsTab";
import PosStorefront from "@/app/(pos)/pos/posmode/PosStorefront";
import { useLang } from "@/lib/lang-context";
import { cn } from "@/lib/utils";
import { CalendarDays, Layers } from "lucide-react";

const POS_STORAGE_KEY = "admin_pos_mode";
const ORIGIN_KEY = "pos_enter_origin";

type Tab = "bookings" | "services";

function readOrigin(): { x: number; y: number } {
  try {
    const raw = sessionStorage.getItem(ORIGIN_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: 0 };
}

export default function AdminPosPage() {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [coverClip, setCoverClip] = useState<string | null>(null);  // entry reveal
  const [exitRipple, setExitRipple] = useState<{ x: number; y: number } | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entry: circle-collapse reveal (primary cover shrinks from button origin)
  useEffect(() => {
    const origin = readOrigin();
    setCoverClip(`circle(200vmax at ${origin.x}px ${origin.y}px)`);
    // Start animation on next frame so initial value registers
    const id = requestAnimationFrame(() => setCoverClip(`circle(0px at ${origin.x}px ${origin.y}px)`));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleExit() {
    const origin = readOrigin();
    setExitRipple(origin);
    navTimer.current = setTimeout(() => {
      localStorage.removeItem(POS_STORAGE_KEY);
      try {
        sessionStorage.setItem("pos_return_origin", JSON.stringify(origin));
        sessionStorage.removeItem(ORIGIN_KEY);
      } catch {}
      router.push("/zw0/dashboard");
    }, 480);
  }

  async function handleLock() {
    localStorage.setItem(POS_STORAGE_KEY, "true");
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/zw0");
  }

  useEffect(() => () => { if (navTimer.current) clearTimeout(navTimer.current); }, []);

  const TABS: { id: Tab; icon: typeof CalendarDays; label: string }[] = [
    { id: "bookings", icon: CalendarDays, label: t("admin.tab_bookings") },
    { id: "services", icon: Layers,       label: t("admin.tab_services") },
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-light z-50" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Entry: circle-collapse reveal ── */}
      {coverClip && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none"
          style={{ background: "var(--color-primary, #5A0F1B)" }}
          initial={false}
          animate={{ clipPath: coverClip }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => setCoverClip(null)}
        />
      )}

      {/* ── Exit: circle-expand ── */}
      <AnimatePresence>
        {exitRipple && (
          <motion.div
            key="exit-ripple"
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{ background: "var(--color-primary, #5A0F1B)" }}
            initial={{ clipPath: `circle(0px at ${exitRipple.x}px ${exitRipple.y}px)` }}
            animate={{ clipPath: `circle(200vmax at ${exitRipple.x}px ${exitRipple.y}px)` }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.6, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="flex-none bg-light border-b border-dark/6 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/media/Logo.svg" alt="WellnessHub" width={22} height={22} className="w-5 h-5 object-contain" />
            <span className="text-sm font-bold text-dark tracking-tight">WellnessHub</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t("pos.pos_mode_badge")}</span>
          </div>
          <div className="flex items-center gap-1 bg-dark/5 rounded-xl p-1">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeTab === id ? "bg-light text-primary shadow-sm" : "text-dark/45 hover:text-dark/70"
                )}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {activeTab === "bookings" && <BookingsTab />}
            {activeTab === "services" && <PosStorefront />}
          </motion.div>
        </AnimatePresence>
      </main>

      <PosModeDock onExit={handleExit} onLock={handleLock} />
    </div>
  );
}
