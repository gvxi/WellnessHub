"use client";

import { motion } from "framer-motion";
import { CalendarDays, Layers, Megaphone, BarChart2, Settings, FileEdit, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { PosTab } from "./PosDashboardClient";

interface Props {
  activeTab: PosTab;
  visibleTabs: PosTab[];
  onTabChange: (tab: PosTab) => void;
  onAddPress?: () => void;
}

const TAB_META: Record<PosTab, { icon: typeof CalendarDays; labelKey: string }> = {
  bookings:  { icon: CalendarDays, labelKey: "admin.tab_bookings" },
  services:  { icon: Layers,       labelKey: "admin.tab_services" },
  ads:       { icon: Megaphone,    labelKey: "admin.tab_ads" },
  analytics: { icon: BarChart2,    labelKey: "admin.tab_analytics" },
  settings:  { icon: Settings,     labelKey: "admin.tab_settings" },
  about:     { icon: FileEdit,     labelKey: "admin.tab_about" },
  team:      { icon: Users,        labelKey: "admin.tab_team" },
};

const PRIMARY_TABS: PosTab[] = ["bookings", "services", "ads", "analytics"];

export default function PosBottomNav({ activeTab, visibleTabs, onTabChange, onAddPress }: Props) {
  const { t } = useLang();
  const bottomTabs = PRIMARY_TABS.filter((tab) => visibleTabs.includes(tab));

  if (bottomTabs.length === 0) return null;

  const showAdd = !!onAddPress;
  const leftTabs = showAdd ? bottomTabs.slice(0, 2) : bottomTabs;
  const rightTabs = showAdd ? bottomTabs.slice(2) : [];

  return (
    <nav className="flex-none h-[68px] bg-light border-t border-dark/8 flex items-center px-2 safe-area-pb">
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-1 justify-around">
          {leftTabs.map((tab) => {
            const { icon: Icon, labelKey } = TAB_META[tab];
            return (
              <NavButton key={tab} active={activeTab === tab} label={t(labelKey)}
                icon={<Icon size={20} />} onClick={() => onTabChange(tab)} />
            );
          })}
        </div>

        {showAdd && (
          <div className="flex-none mx-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onAddPress}
              className="w-14 h-14 -mt-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <Plus size={24} className="text-light" />
            </motion.button>
          </div>
        )}

        <div className="flex flex-1 justify-around">
          {rightTabs.map((tab) => {
            const { icon: Icon, labelKey } = TAB_META[tab];
            return (
              <NavButton key={tab} active={activeTab === tab} label={t(labelKey)}
                icon={<Icon size={20} />} onClick={() => onTabChange(tab)} />
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function NavButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[52px]"
    >
      <span className={cn("transition-colors", active ? "text-primary" : "text-dark/35")}>
        {icon}
      </span>
      <span className={cn("text-[10px] font-medium transition-colors", active ? "text-primary" : "text-dark/35")}>
        {label}
      </span>
      <span className="h-1 flex justify-center">
        {active && (
          <motion.span
            layoutId="pos-nav-indicator"
            className="w-1 h-1 rounded-full bg-primary block"
          />
        )}
      </span>
    </button>
  );
}
