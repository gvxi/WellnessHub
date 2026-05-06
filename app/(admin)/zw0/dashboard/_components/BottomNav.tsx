"use client";

import { motion } from "framer-motion";
import { CalendarDays, Layers, Plus, Megaphone, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { AdminTab } from "../page";

interface Props {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onAddPress: () => void;
}

export default function BottomNav({ activeTab, onTabChange, onAddPress }: Props) {
  const { t } = useLang();

  const NAV_ITEMS = [
    { tab: "bookings" as AdminTab, icon: CalendarDays, label: t("admin.tab_bookings") },
    { tab: "services" as AdminTab, icon: Layers,       label: t("admin.tab_services") },
  ];

  const NAV_ITEMS_RIGHT = [
    { tab: "ads"  as AdminTab, icon: Megaphone, label: t("admin.tab_ads") },
    { tab: "team" as AdminTab, icon: Users,     label: t("admin.tab_team") },
  ];

  return (
    <nav className="flex-none h-[68px] bg-light border-t border-dark/8 flex items-center px-2 safe-area-pb">
      <div className="flex items-center justify-between w-full">
        {/* Start items */}
        <div className="flex flex-1 justify-around">
          {NAV_ITEMS.map(({ tab, icon: Icon, label }) => (
            <NavButton
              key={tab}
              active={activeTab === tab}
              label={label}
              icon={<Icon size={20} />}
              onClick={() => onTabChange(tab)}
            />
          ))}
        </div>

        {/* Plus button */}
        <div className="flex-none mx-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onAddPress}
            className="w-14 h-14 -mt-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Plus size={24} className="text-light" />
          </motion.button>
        </div>

        {/* End items */}
        <div className="flex flex-1 justify-around">
          {NAV_ITEMS_RIGHT.map(({ tab, icon: Icon, label }) => (
            <NavButton
              key={tab}
              active={activeTab === tab}
              label={label}
              icon={<Icon size={20} />}
              onClick={() => onTabChange(tab)}
            />
          ))}
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
      <span
        className={cn(
          "text-[10px] font-medium transition-colors",
          active ? "text-primary" : "text-dark/35"
        )}
      >
        {label}
      </span>
      <span className="h-1 flex justify-center">
        {active && (
          <motion.span
            layoutId="nav-indicator"
            className="w-1 h-1 rounded-full bg-primary block"
          />
        )}
      </span>
    </button>
  );
}
