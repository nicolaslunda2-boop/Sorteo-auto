"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { SORTEO } from "@/lib/config";

export function SiteHeader() {
  const { items } = useCart();
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand" aria-label="Inicio">
          <span className="brand-seal">{SORTEO.serie}</span>
          <span className="brand-name">{SORTEO.titulo}</span>
        </Link>
        <nav className="nav">
          <Link className="nav-link" href="/#premios">Premios</Link>
          <Link className="nav-link" href="/#cartones">Cartones</Link>
          <Link className="nav-link" href="/#como-funciona">Cómo funciona</Link>
          <Link className="nav-cart" href="/carrito">
            Mi compra {items.length > 0 && <span className="badge">{items.length}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
