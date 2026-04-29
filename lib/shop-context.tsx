"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { ServiceItem } from "@/lib/services-data";
import { categories } from "@/lib/services-data";

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getItemById(id: string): ServiceItem | undefined {
  return categories
    .flatMap((c) => c.subs)
    .flatMap((s) => s.items)
    .find((i) => i.id === id);
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export type CartItem = { id: string; qty: number };

type CartAction =
  | { type: "ADD"; id: string }
  | { type: "REMOVE"; id: string }
  | { type: "UPDATE"; id: string; qty: number }
  | { type: "CLEAR" }
  | { type: "INIT"; items: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "INIT":
      return action.items;
    case "ADD": {
      const existing = state.find((i) => i.id === action.id);
      if (existing) return state.map((i) => i.id === action.id ? { ...i, qty: i.qty + 1 } : i);
      return [...state, { id: action.id, qty: 1 }];
    }
    case "REMOVE":
      return state.filter((i) => i.id !== action.id);
    case "UPDATE":
      return state.map((i) => i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalCount: number;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside ShopProvider");
  return ctx;
}

// ─── Favorites ───────────────────────────────────────────────────────────────

interface FavsContextType {
  ids: Set<string>;
  toggle: (id: string) => void;
  isFav: (id: string) => boolean;
}

const FavsContext = createContext<FavsContextType | null>(null);

export function useFavs() {
  const ctx = useContext(FavsContext);
  if (!ctx) throw new Error("useFavs must be used inside ShopProvider");
  return ctx;
}

// ─── UI (selected item drawer + cart drawer open state) ──────────────────────

interface UIContextType {
  selectedItem: ServiceItem | null;
  setSelectedItem: (item: ServiceItem | null) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  favsOpen: boolean;
  setFavsOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside ShopProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cartItems, dispatch] = useReducer(cartReducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wh_cart");
      if (raw) dispatch({ type: "INIT", items: JSON.parse(raw) as CartItem[] });
      const rawFavs = localStorage.getItem("wh_favs");
      if (rawFavs) setFavIds(new Set(JSON.parse(rawFavs) as string[]));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist cart
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("wh_cart", JSON.stringify(cartItems));
  }, [cartItems, hydrated]);

  // Persist favs
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("wh_favs", JSON.stringify([...favIds]));
  }, [favIds, hydrated]);

  const cart: CartContextType = {
    items: cartItems,
    addItem: (id) => dispatch({ type: "ADD", id }),
    removeItem: (id) => dispatch({ type: "REMOVE", id }),
    updateQty: (id, qty) => dispatch({ type: "UPDATE", id, qty }),
    clearCart: () => dispatch({ type: "CLEAR" }),
    totalCount: cartItems.reduce((sum, i) => sum + i.qty, 0),
    isInCart: (id) => cartItems.some((i) => i.id === id),
  };

  const favs: FavsContextType = {
    ids: favIds,
    toggle: (id) =>
      setFavIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    isFav: (id) => favIds.has(id),
  };

  const ui: UIContextType = {
    selectedItem,
    setSelectedItem,
    cartOpen,
    setCartOpen,
    favsOpen,
    setFavsOpen,
  };

  return (
    <CartContext value={cart}>
      <FavsContext value={favs}>
        <UIContext value={ui}>
          {children}
        </UIContext>
      </FavsContext>
    </CartContext>
  );
}
