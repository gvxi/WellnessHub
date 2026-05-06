"use client";

import Image from "next/image";
import { LogOut, CalendarDays, Layers, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PosTab } from "./PosDashboardClient";
import type { EmployeePermissions } from "@/lib/supabase/types";

interface Props {
  activeTab: PosTab;
  onTabChange: (tab: PosTab) => void;
  onLogout: () => void;
  permissions: EmployeePermissions;
}

const TABS: { id: PosTab; label: string; icon: typeof CalendarDays }[] = [
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "services", label: "Services", icon: Layers },
  { id: "ads",      label: "Ads",      icon: Megaphone },
];

export default function PosTopNav({ activeTab, onTabChange, onLogout, permissions }: Props) {
  return (
    <header className="flex-none bg-light border-b border-dark/8 h-14 flex items-stretch px-4 gap-0">
      {/* Brand */}
      <div className="flex items-center gap-2 me-6 flex-none">
        <Image src="/media/Logo.svg" alt="WellnessHub" width={18} height={18} className="w-[18px] h-[18px] object-contain" />
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

      {/* Logout */}
      <div className="flex items-center flex-none ms-2">
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-dark/40 hover:text-dark/70 hover:bg-dark/5 rounded-xl transition-colors"
        >
          <LogOut size={13} />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </header>
  );
}
