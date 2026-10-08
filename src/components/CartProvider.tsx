"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { id: number; code: string; grid: number[]; reserved_until: string };

type CartState = {
  session: string | null;
  items: CartItem[];
  ids: Set<number>;
  busy: number | null;
  error: string | null;
  expiresAt: number | null;
  add: (ticketId: number) => Promise<boolean>;
  remove: (ticketId: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const CartContext = createContext<CartState | null>(null);
const KEY = "sorteo-session";
const REF_KEY = "sorteo-ref";

/** Guarda el código de quien invitó (links con ?ref=CODIGO). */
function captureReferral() {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase();
    if (ref && /^[A-Z0-9]{5,10}$/.test(ref)) localStorage.setItem(REF_KEY, ref);
  } catch {
    /* sin almacenamiento disponible */
  }
}

/** Código de referido guardado (o null). */
export function getReferral(): string | null {
  try {
    return localStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

function getSession(): string {
  try {
    let s = localStorage.getItem(KEY);
    if (!s) {
      s = crypto.randomUUID();
      localStorage.setItem(KEY, s);
    }
    return s;
  } catch {
    return crypto.randomUUID();
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(getSession());
    captureReferral();
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/cart?session=${session}`, { cache: "no-store" });
      if (res.ok) setItems((await res.json()).items ?? []);
    } catch {
      /* sin conexión: se reintenta en el próximo ciclo */
    }
  }, [session]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const mutate = useCallback(
    async (method: "POST" | "DELETE", ticketId: number) => {
      if (!session) return false;
      setBusy(ticketId);
      setError(null);
      try {
        const res = await fetch("/api/cart", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session, ticketId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "No se pudo completar la acción.");
          return false;
        }
        setItems(data.items ?? []);
        return true;
      } catch {
        setError("Sin conexión. Revisá tu internet e intentá de nuevo.");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [session],
  );

  const expiresAt = useMemo(() => {
    if (items.length === 0) return null;
    return Math.min(...items.map((i) => new Date(i.reserved_until).getTime()));
  }, [items]);

  // Cuando vence la reserva más próxima, actualizamos el carrito.
  useEffect(() => {
    if (!expiresAt) return;
    const ms = Math.max(0, expiresAt - Date.now()) + 500;
    const t = setTimeout(refresh, ms);
    return () => clearTimeout(t);
  }, [expiresAt, refresh]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const value: CartState = {
    session,
    items,
    ids: useMemo(() => new Set(items.map((i) => i.id)), [items]),
    busy,
    error,
    expiresAt,
    add: (id) => mutate("POST", id),
    remove: async (id) => {
      await mutate("DELETE", id);
    },
    refresh,
    clearError: () => setError(null),
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {error && (
        <div className="toast" role="alert" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}

/** Cuenta regresiva en mm:ss hasta `target`. */
export function useCountdown(target: number | null): { label: string; seconds: number } {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return { label: "", seconds: 0 };
  const seconds = Math.max(0, Math.floor((target - now) / 1000));
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return { label: `${m}:${s}`, seconds };
}
