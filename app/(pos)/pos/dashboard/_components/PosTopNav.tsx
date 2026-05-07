"use client";

import Image from "next/image";
import { LogOut, CalendarDays, Layers, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { PosTab } from "./PosDashboardClient";
import type { Lang } from "@/lib/lang-context";

interface Props {
  activeTab: PosTab;
  onTabChange: (tab: PosTab) => void;
  onLogout: () => void;
}

export default function PosTopNav({ activeTab, onTabChange, onLogout }: Props) {
  const { t, lang, setLang } = useLang();

  function toggleLang() {
    setLang(lang === "en" ? "ar" : "en");
  }

  const TABS: { id: PosTab; label: string; icon: typeof CalendarDays }[] = [
    { id: "bookings", label: t("pos.tab_bookings"), icon: CalendarDays },
    { id: "services", label: t("pos.tab_services"), icon: Layers },
    { id: "ads",      label: t("pos.tab_ads"),      icon: Megaphone },
  ];

  return (
    <header className="flex-none bg-light border-b border-dark/8 h-14 flex items-stretch px-4 gap-0">
      {/* Brand */}
      <div className="flex items-center gap-2 me-6 flex-none">
        <Image
          src="/media/Logo.svg"
          alt="WellnessHub"
          width={18}
          height={18}
          unoptimized
          className="w-[18px] h-[18px] object-contain"
        />
        <span className="text-sm font-bold text-dark tracking-tight hidden sm:block">WellnessHub</span>
        <span className="ms-1 text-[9px] uppercase tracking-[0.15em] font-semibold text-secondary/60 hidden md:block">
          POS
        </span>
      </div>

      {/* Chrome-style tabs */}
      <nav className="flex items-stretch gap-0.5 flex-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 text-sm font-medium transition-colors border-b-2 h-full",
              activeTab === id
                ? "border-primary text-primary bg-primary/4"
                : "border-transparent text-dark/45 hover:text-dark/70 hover:bg-dark/3"
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </nav>

      {/* Lang toggle */}
      <div className="flex items-center flex-none">
        <button
          onClick={toggleLang}
          className="px-2.5 py-1 text-xs font-semibold text-dark/50 hover:text-dark/80 hover:bg-dark/5 rounded-lg transition-colors"
        >
          {lang === "en" ? "ع" : "EN"}
        </button>
      </div>

      {/* Logout */}
      <div className="flex items-center flex-none ms-1">
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-dark/40 hover:text-dark/70 hover:bg-dark/5 rounded-xl transition-colors"
        >
          <LogOut size={13} />
          <span className="hidden sm:block">{t("pos.sign_out")}</span>
        </button>
      </div>
    </header>
  );
}
