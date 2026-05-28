import type { CartItem } from "./shop-context";

const CART_KEY = "wh_cart";

type StoredCart = { items: CartItem[]; sig: string };

function buildPayload(items: CartItem[]): string {
  return JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty })));
}

async function requestSign(payload: string): Promise<string> {
  const res = await fetch("/api/cart/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sign", payload }),
  });
  if (!res.ok) throw new Error("sign_failed");
  const { sig } = await res.json() as { sig: string };
  return sig;
}

async function requestVerify(payload: string, sig: string): Promise<boolean> {
  const res = await fetch("/api/cart/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", payload, sig }),
  });
  if (!res.ok) return true; // network error — don't clear cart
  const { valid } = await res.json() as { valid: boolean };
  return valid;
}

let _signTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSign(items: CartItem[]): void {
  if (_signTimer) clearTimeout(_signTimer);
  _signTimer = setTimeout(async () => {
    try {
      const sig = await requestSign(buildPayload(items));
      // Read current stored data and update just the sig
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredCart;
      stored.sig = sig;
      localStorage.setItem(CART_KEY, JSON.stringify(stored));
    } catch {
      // non-fatal — cart still functions, sig will be refreshed next change
    }
  }, 400);
}

export function saveCartSigned(items: CartItem[]): void {
  const raw = localStorage.getItem(CART_KEY);
  let existingSig = "";
  try {
    if (raw) {
      const stored = JSON.parse(raw) as StoredCart | CartItem[];
      if (!Array.isArray(stored)) existingSig = stored.sig ?? "";
    }
  } catch { /* noop */ }

  localStorage.setItem(CART_KEY, JSON.stringify({ items, sig: existingSig }));
  scheduleSign(items);
}

export async function loadCartVerified(): Promise<CartItem[] | null> {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];

    let stored: StoredCart | CartItem[];
    try {
      stored = JSON.parse(raw) as StoredCart | CartItem[];
    } catch {
      return [];
    }

    // Migrate old plain-array format
    if (Array.isArray(stored)) {
      const items = stored.filter((i) => i.snapshot);
      saveCartSigned(items);
      return items;
    }

    const items = (stored.items ?? []).filter((i) => i.snapshot);
    const sig = stored.sig ?? "";

    if (!sig) {
      // No sig yet — sign and accept (first run with new format)
      saveCartSigned(items);
      return items;
    }

    const valid = await requestVerify(buildPayload(items), sig);
    if (!valid) {
      localStorage.removeItem(CART_KEY);
      return null; // signals tampered to caller
    }

    return items;
  } catch {
    return [];
  }
}
