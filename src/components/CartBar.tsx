"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, useCountdown } from "./CartProvider";
import { calcTotal, money } from "@/lib/pricing";

export function CartBar() {
  const { items, expiresAt } = useCart();
  const pathname = usePathname();
  const { label, seconds } = useCountdown(expiresAt);
  if (items.length === 0 || pathname !== "/") return null;
  const b = calcTotal(items.length);

  return (
    <div className="cart-bar">
      <div className="container">
        <div className="cart-bar-info">
          <span>
            <strong>{items.length}</strong> {items.length === 1 ? "cartón" : "cartones"} · <strong>{money(b.total)}</strong>
          </span>
          <span className={`timer ${seconds < 120 ? "low" : ""}`} title="Tiempo de reserva">
            ⏱ {label}
          </span>
        </div>
        <Link href="/carrito" className="btn btn-gold">
          Ir a pagar
        </Link>
      </div>
    </div>
  );
}
