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
import { saveCartSigned, loadCartVerified } from "@/lib/cart-hmac";
import { useToast } from "@/lib/toast-context";

// ─── Module-level item registry (populated at render time from DB items) ─────

const _itemRegistry = new Map<string, ServiceItem>();

export function registerItem(item: ServiceItem) {
  _itemRegistry.set(item.id, item);
}

export function getItemById(id: string): ServiceItem | undefined {
  if (_itemRegistry.has(id)) return _itemRegistry.get(id);
  return categories
    .flatMap((c) => c.subs)
    .flatMap((s) => s.items)
    .find((i) => i.id === id);
}

export function isItemVisible(id: string): boolean {
  // tier-variant IDs use format "svcId::tierLabel"
  const baseId = id.includes("::") ? id.split("::")[0] : id;
  return _itemRegistry.has(baseId);
}

export function isRegistryReady(): boolean {
  return _itemRegistry.size > 0;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export type CartItem = { id: string; qty: number; snapshot: ServiceItem };

type CartAction =
  | { type: "ADD"; item: ServiceItem; qty?: number }
  | { type: "REMOVE"; id: string }
  | { type: "UPDATE"; id: string; qty: number }
  | { type: "CLEAR" }
  | { type: "INIT"; items: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "INIT":
      return action.items;
    case "ADD": {
      const qty = action.qty ?? 1;
      const existing = state.find((i) => i.id === action.item.id);
      if (existing)
        return state.map((i) =>
          i.id === action.item.id ? { ...i, qty: i.qty + qty } : i
        );
      return [...state, { id: action.item.id, qty, snapshot: action.item }];
    }
    case "REMOVE":
      return state.filter((i) => i.id !== action.id);
    case "UPDATE":
      return state.map((i) =>
        i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i
      );
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: ServiceItem, qty?: number) => void;
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
  favItems: ServiceItem[];
  toggle: (item: ServiceItem) => void;
  isFav: (id: string) => boolean;
}

const FavsContext = createContext<FavsContextType | null>(null);

export function useFavs() {
  const ctx = useContext(FavsContext);
  if (!ctx) throw new Error("useFavs must be used inside ShopProvider");
  return ctx;
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export type AuthStep = "signin" | "signup" | "profile";

interface UIContextType {
  selectedItem: ServiceItem | null;
  setSelectedItem: (item: ServiceItem | null) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  favsOpen: boolean;
  setFavsOpen: (open: boolean) => void;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  authStep: AuthStep;
  setAuthStep: (step: AuthStep) => void;
  profileDrawerOpen: boolean;
  setProfileDrawerOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside ShopProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ShopProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [cartItems, dispatch] = useReducer(cartReducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [favMap, setFavMap] = useState<Map<string, ServiceItem>>(new Map());
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>("signin");
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const items = await loadCartVerified();
      if (items === null) {
        dispatch({ type: "CLEAR" });
        showToast("Cart was cleared — data integrity check failed.", "cart");
      } else if (items.length > 0) {
        dispatch({ type: "INIT", items });
      }
      try {
        const rawFavs = localStorage.getItem("wh_favs");
        if (rawFavs) {
          const parsed = JSON.parse(rawFavs);
          if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
            setFavMap(new Map(parsed as [string, ServiceItem][]));
          }
        }
      } catch { /* ignore malformed favs */ }
      setHydrated(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCartSigned(cartItems);
  }, [cartItems, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("wh_favs", JSON.stringify(Array.from(favMap.entries())));
  }, [favMap, hydrated]);

  const favIds = new Set(favMap.keys());
  const favItems = Array.from(favMap.values());

  const cart: CartContextType = {
    items: cartItems,
    addItem: (item, qty) => dispatch({ type: "ADD", item, qty }),
    removeItem: (id) => dispatch({ type: "REMOVE", id }),
    updateQty: (id, qty) => dispatch({ type: "UPDATE", id, qty }),
    clearCart: () => dispatch({ type: "CLEAR" }),
    totalCount: cartItems.reduce((sum, i) => sum + i.qty, 0),
    isInCart: (id) => cartItems.some((i) => i.id === id),
  };

  const favs: FavsContextType = {
    ids: favIds,
    favItems,
    toggle: (item) =>
      setFavMap((prev) => {
        const next = new Map(prev);
        next.has(item.id) ? next.delete(item.id) : next.set(item.id, item);
        return next;
      }),
    isFav: (id) => favMap.has(id),
  };

  const ui: UIContextType = {
    selectedItem,
    setSelectedItem,
    cartOpen,
    setCartOpen,
    favsOpen,
    setFavsOpen,
    authOpen,
    setAuthOpen,
    authStep,
    setAuthStep,
    profileDrawerOpen,
    setProfileDrawerOpen,
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
