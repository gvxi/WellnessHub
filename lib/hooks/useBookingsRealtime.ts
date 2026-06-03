"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

const BIZ_ID = process.env.NEXT_PUBLIC_BUSINESS_ID!;

interface Options {
  channelName: string;
  /** Called when a booking is inserted (after optional delay). */
  onInsert?: () => void;
  /** Called with the new row's id + status when a booking is updated. */
  onUpdate?: (id: string, status: string) => void;
  /** Called with the deleted row's id when a booking is removed. */
  onDelete?: (id: string) => void;
  /** Milliseconds to delay INSERT events before notifying UI (POS delay). Default: 0. */
  delayMs?: number;
}

export function useBookingsRealtime({
  channelName,
  onInsert,
  onUpdate,
  onDelete,
  delayMs = 0,
}: Options) {
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  useEffect(() => { onInsertRef.current = onInsert; }, [onInsert]);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onDeleteRef.current = onDelete; }, [onDelete]);

  useEffect(() => {
    if (typeof window === "undefined" || !BIZ_ID) return;

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `business_id=eq.${BIZ_ID}`,
        },
        (payload) => {
          const p = payload as {
            eventType: "INSERT" | "UPDATE" | "DELETE";
            new: Record<string, unknown>;
            old: Record<string, unknown>;
          };

          if (p.eventType === "INSERT") {
            const fire = () => {
              showNotification(p.new);
              onInsertRef.current?.();
            };
            if (delayMs > 0) setTimeout(fire, delayMs);
            else fire();
          } else if (p.eventType === "UPDATE") {
            onUpdateRef.current?.(p.new.id as string, p.new.status as string);
          } else if (p.eventType === "DELETE") {
            onDeleteRef.current?.(p.old.id as string);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, delayMs]);
}

function showNotification(row: Record<string, unknown>) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const customerName =
    (row.customer_data as { username?: string } | null)?.username ?? "Guest";
  new Notification("New Booking", {
    body: customerName,
    tag: String(row.id),
    icon: "/favicon.ico",
  });
}
