"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { CalendarDays, Layers, Plus, Megaphone, Users, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { AdminTab } from "../page";

interface Props {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onAddPress: () => void;
  onEnterPos?: (origin: { x: number; y: number }) => void;
}

export default function BottomNav({ activeTab, onTabChange, onAddPress, onEnterPos }: Props) {
  const { t } = useLang();
  const mouseX = useMotionValue(Infinity);

  const NAV_LEFT = [
    { tab: "bookings" as AdminTab, icon: CalendarDays, label: t("admin.tab_bookings") },
    { tab: "services" as AdminTab, icon: Layers, label: t("admin.tab_services") },
  ];
  const NAV_RIGHT = [
    { tab: "ads" as AdminTab, icon: Megaphone, label: t("admin.tab_ads") },
    { tab: "team" as AdminTab, icon: Users, label: t("admin.tab_team") },
  ];

  return (
    <>
      {/* ── Mobile nav ── */}
      <nav className="flex md:hidden flex-none h-[68px] bg-light border-t border-dark/8 items-center px-2 safe-area-pb">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-1 justify-around">
            {NAV_LEFT.map(({ tab, icon: Icon, label }) => (
              <MobileNavButton key={tab} active={activeTab === tab} label={label}
                icon={<Icon size={20} />} onClick={() => onTabChange(tab)} />
            ))}
          </div>
          <div className="flex-none mx-2">
            <motion.button whileTap={{ scale: 0.92 }} onClick={onAddPress}
              className="w-14 h-14 -mt-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Plus size={24} className="text-light" />
            </motion.button>
          </div>
          <div className="flex flex-1 justify-around">
            {NAV_RIGHT.map(({ tab, icon: Icon, label }) => (
              <MobileNavButton key={tab} active={activeTab === tab} label={label}
                icon={<Icon size={20} />} onClick={() => onTabChange(tab)} />
            ))}
          </div>
        </div>
      </nav>

      {/* ── Mobile POS peeking card (right wall, above bottom nav, rotated) ── */}
      {onEnterPos && (
        <motion.button
          className="md:hidden fixed z-[48]"
          style={{
            right: 0,
            bottom: "calc(68px + 24px)",
            transformOrigin: "right center",
          }}
          initial={{ rotate: -90, x: "calc(50% - 28px)" }}
          animate={{ rotate: -90, x: "calc(50% - 28px)" }}
          whileTap={{ rotate: -90, x: 0, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onEnterPos?.({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary shadow-xl flex flex-col items-center justify-center gap-1.5">
            <Monitor size={18} className="text-light" />
            <span className="text-[8px] font-bold tracking-[0.2em] text-light/80 uppercase">
              POS
            </span>
          </div>
        </motion.button>
      )}

      {/* ── Desktop dock (flex-flow, transparent surround) ── */}
      <div className="hidden md:flex flex-none justify-center pb-5 pt-2 items-end gap-3">
        <motion.div
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="flex items-end gap-2 px-3 py-2.5 rounded-2xl bg-light border border-dark/10 shadow-2xl shadow-dark/20"
        >
          {NAV_LEFT.map(({ tab, icon: Icon, label }) => (
            <DockItem key={tab} mouseX={mouseX} label={label}
              icon={<Icon size={20} />} active={activeTab === tab}
              onClick={() => onTabChange(tab)} />
          ))}

          <div className="w-px h-8 self-center bg-dark/12 mx-0.5" />

          <DockItem mouseX={mouseX} label={t("admin.add") ?? "Add"} isPlus
            icon={<Plus size={20} className="text-light" />}
            active={false} onClick={onAddPress} />

          <div className="w-px h-8 self-center bg-dark/12 mx-0.5" />

          {NAV_RIGHT.map(({ tab, icon: Icon, label }) => (
            <DockItem key={tab} mouseX={mouseX} label={label}
              icon={<Icon size={20} />} active={activeTab === tab}
              onClick={() => onTabChange(tab)} />
          ))}
        </motion.div>

        {/* Attached POS mode button — separate from dock pill, like trash on Mac dock */}
        {onEnterPos && (
          <PosDockButton
            mouseX={mouseX}
            label={t("pos.pos_mode_enter")}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onEnterPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
            }}
          />
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
        isPlus
          ? "bg-primary shadow-md shadow-primary/30"
          : active
          ? "bg-primary/12"
          : "hover:bg-dark/7"
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
      <span className={cn(
        "transition-colors",
        isPlus ? "text-light" : active ? "text-primary" : "text-dark/55"
      )}>
        {icon}
      </span>
      {!isPlus && active && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
      )}
    </motion.button>
  );
}

/* ── Mobile nav button ── */
function MobileNavButton({
  active, label, icon, onClick,
}: {
  active: boolean; label: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[52px]">
      <span className={cn("transition-colors", active ? "text-primary" : "text-dark/35")}>{icon}</span>
      <span className={cn("text-[10px] font-medium transition-colors", active ? "text-primary" : "text-dark/35")}>
        {label}
      </span>
      <span className="h-1 flex justify-center">
        {active && (
          <motion.span layoutId="nav-indicator" className="w-1 h-1 rounded-full bg-primary block" />
        )}
      </span>
    </button>
  );
}

/* ── POS dock button (same magnification + tooltip as DockItem) ── */
function PosDockButton({
  mouseX, label, onClick,
}: {
  mouseX: MotionValue<number>;
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
      className="relative flex items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/25 cursor-pointer select-none"
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
      <Monitor size={20} className="text-light" />
    </motion.button>
  );
}
