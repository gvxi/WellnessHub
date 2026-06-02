"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { CalendarDays, Layers, Megaphone, BarChart2, Settings, FileEdit, Plus, Users, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { PosTab } from "./PosDashboardClient";

interface Props {
  activeTab: PosTab;
  visibleTabs: PosTab[];
  onTabChange: (tab: PosTab) => void;
  onAddPress?: () => void;
  onEnterPos?: (origin: { x: number; y: number }) => void;
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

export default function PosBottomNav({ activeTab, visibleTabs, onTabChange, onAddPress, onEnterPos }: Props) {
  const { t } = useLang();
  const mouseX = useMotionValue(Infinity);

  const bottomTabs = PRIMARY_TABS.filter((tab) => visibleTabs.includes(tab));
  if (bottomTabs.length === 0) return null;

  const showAdd = !!onAddPress;
  const leftTabs = showAdd ? bottomTabs.slice(0, 2) : bottomTabs;
  const rightTabs = showAdd ? bottomTabs.slice(2) : [];

  return (
    <>
      {/* ── Mobile nav ── */}
      <nav className="flex md:hidden flex-none h-[68px] bg-light border-t border-dark/8 items-center px-2 safe-area-pb">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-1 justify-around">
            {leftTabs.map((tab) => {
              const { icon: Icon, labelKey } = TAB_META[tab];
              return (
                <MobileNavButton key={tab} active={activeTab === tab} label={t(labelKey)}
                  icon={<Icon size={20} />} onClick={() => onTabChange(tab)} />
              );
            })}
          </div>

          {showAdd && (
            <div className="flex-none mx-2">
              <motion.button whileTap={{ scale: 0.92 }} onClick={onAddPress}
                className="w-14 h-14 -mt-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Plus size={24} className="text-light" />
              </motion.button>
            </div>
          )}

          <div className="flex flex-1 justify-around">
            {rightTabs.map((tab) => {
              const { icon: Icon, labelKey } = TAB_META[tab];
              return (
                <MobileNavButton key={tab} active={activeTab === tab} label={t(labelKey)}
                  icon={<Icon size={20} />} onClick={() => onTabChange(tab)} />
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Mobile POS peeking card (right wall, above bottom nav, rotated) ── */}
      {onEnterPos && (
        <motion.button
          className="md:hidden fixed z-50"
          style={{ right: 0, bottom: "calc(68px + 24px)", transformOrigin: "right center" }}
          initial={{ rotate: -90, x: "calc(50% - 28px)" }}
          animate={{ rotate: -90, x: "calc(50% - 28px)" }}
          whileTap={{ rotate: -90, x: 0, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onEnterPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary shadow-xl flex flex-col items-center justify-center gap-1.5">
            <Monitor size={18} className="text-light" />
            <span className="text-[8px] font-bold tracking-[0.2em] text-light/80 uppercase">POS</span>
          </div>
        </motion.button>
      )}

      {/* ── Desktop dock ── */}
      <div className="hidden md:flex flex-none justify-center pb-5 pt-2 items-end gap-3">
        <motion.div
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="flex items-end gap-2 px-3 py-2.5 rounded-2xl bg-light border border-dark/10 shadow-2xl shadow-dark/20"
        >
          {leftTabs.map((tab) => {
            const { icon: Icon, labelKey } = TAB_META[tab];
            return (
              <DockItem key={tab} mouseX={mouseX} label={t(labelKey)}
                icon={<Icon size={20} />} active={activeTab === tab}
                onClick={() => onTabChange(tab)} />
            );
          })}

          {showAdd && (
            <>
              <div className="w-px h-8 self-center bg-dark/12 mx-0.5" />
              <DockItem mouseX={mouseX} label="Add" isPlus
                icon={<Plus size={20} className="text-light" />}
                active={false} onClick={onAddPress!} />
              <div className="w-px h-8 self-center bg-dark/12 mx-0.5" />
            </>
          )}

          {rightTabs.map((tab) => {
            const { icon: Icon, labelKey } = TAB_META[tab];
            return (
              <DockItem key={tab} mouseX={mouseX} label={t(labelKey)}
                icon={<Icon size={20} />} active={activeTab === tab}
                onClick={() => onTabChange(tab)} />
            );
          })}
        </motion.div>

        {/* Attached POS button */}
        {onEnterPos && (
          <motion.button
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onEnterPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
            }}
            title="Enter POS mode"
            whileHover={{ scale: 1.14, y: -8 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex-none mb-2.5 w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 cursor-pointer select-none"
          >
            <Monitor size={20} className="text-light" />
          </motion.button>
        )}
      </div>
    </>
  );
}

/* ── Dock item with magnification ── */
function DockItem({
  mouseX, icon, label, active, isPlus, onClick,
}: {
  mouseX: MotionValue<number>;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  isPlus?: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const b = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - b.x - b.width / 2;
  });

  const sizeRaw = useTransform(distance, [-100, 0, 100], [44, 60, 44]);
  const yRaw = useTransform(distance, [-100, 0, 100], [0, -10, 0]);
  const size = useSpring(sizeRaw, { mass: 0.1, stiffness: 200, damping: 14 });
  const y = useSpring(yRaw, { mass: 0.1, stiffness: 200, damping: 14 });

  return (
    <motion.button
      ref={ref}
      style={{ width: size, height: size, y }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex items-center justify-center rounded-xl transition-colors cursor-pointer select-none",
        isPlus ? "bg-primary shadow-md shadow-primary/30" : active ? "bg-primary/12" : "hover:bg-dark/7"
      )}
    >
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.12 }}
          className="absolute -top-9 left-1/2 -translate-x-1/2 text-[11px] font-medium px-2 py-1 rounded-lg bg-dark/88 text-light whitespace-nowrap pointer-events-none shadow-sm"
        >
          {label}
        </motion.div>
      )}
      <span className={cn("transition-colors", isPlus ? "text-light" : active ? "text-primary" : "text-dark/55")}>
        {icon}
      </span>
      {!isPlus && active && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />}
    </motion.button>
  );
}

/* ── Mobile nav button ── */
function MobileNavButton({ active, label, icon, onClick }: {
  active: boolean; label: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[52px]">
      <span className={cn("transition-colors", active ? "text-primary" : "text-dark/35")}>{icon}</span>
      <span className={cn("text-[10px] font-medium transition-colors", active ? "text-primary" : "text-dark/35")}>
        {label}
      </span>
      <span className="h-1 flex justify-center">
        {active && <motion.span layoutId="pos-nav-indicator" className="w-1 h-1 rounded-full bg-primary block" />}
      </span>
    </button>
  );
}
