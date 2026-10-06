"use client";

import Link from "next/link";
import { useState } from "react";
import { BingoCard } from "@/components/BingoCard";
import { useCart, useCountdown } from "@/components/CartProvider";
import { PRECIOS, RESERVA_MINUTOS } from "@/lib/config";
import { calcTotal, money } from "@/lib/pricing";

export default function CarritoPage() {
  const cart = useCart();
  const { label, seconds } = useCountdown(cart.expiresAt);
  const b = calcTotal(cart.items.length);
  const [form, setForm] = useState({ name: "", dni: "", email: "", phone: "" });
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const falta = PRECIOS.comboCantidad - (cart.items.length % PRECIOS.comboCantidad);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: cart.session, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el pago.");
        setSending(false);
        cart.refresh();
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Sin conexión. Revisá tu internet e intentá de nuevo.");
      setSending(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="page">
      <div className="container">
        <div className="kicker">Tu compra</div>
        <h1 className="page-title">Cartones elegidos</h1>

        {cart.items.length === 0 ? (
          <div className="empty">
            <p style={{ marginTop: 0 }}>Todavía no elegiste ningún cartón (o tu reserva de {RESERVA_MINUTOS} minutos venció).</p>
            <Link href="/#cartones" className="btn btn-gold">
              Elegir cartones
            </Link>
          </div>
        ) : (
          <div className="checkout">
            <div>
              <div className="toolbar">
                <span className={`timer ${seconds < 120 ? "low" : ""}`}>⏱ Reserva: {label} restantes</span>
                <Link href="/#cartones" className="btn btn-ghost btn-sm">
                  + Agregar más cartones
                </Link>
              </div>
              <div className="cart-items">
                {cart.items.map((t) => (
                  <BingoCard
                    key={t.id}
                    code={t.code}
                    grid={t.grid}
                    mini
                    inCart
                    footer={
                      <>
                        <span className="ticket-price">
                          <small>Reservado</small>
                          {t.code}
                        </span>
                        <button className="btn btn-sm btn-ink" disabled={cart.busy === t.id} onClick={() => cart.remove(t.id)}>
                          Quitar
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Resumen</h2>
              {b.combos > 0 && (
                <div className="summary-row">
                  <span>
                    {b.combos} combo{b.combos > 1 ? "s" : ""} x {PRECIOS.comboCantidad} cartones
                  </span>
                  <strong>{money(b.combos * PRECIOS.comboPrecio)}</strong>
                </div>
              )}
              {b.singles > 0 && (
                <div className="summary-row">
                  <span>
                    {b.singles} {b.singles > 1 ? "cartones individuales" : "cartón individual"}
                  </span>
                  <strong>{money(b.singles * PRECIOS.individual)}</strong>
                </div>
              )}
              {b.savings > 0 && (
                <div className="summary-row save">
                  <span>Ahorro por combo</span>
                  <strong>−{money(b.savings)}</strong>
                </div>
              )}
              <div className="summary-total">
                <span>Total</span>
                <strong>{money(b.total)}</strong>
              </div>
              {falta > 0 && falta < PRECIOS.comboCantidad && (
                <div className="hint">
                  Sumá {falta} {falta > 1 ? "cartones" : "cartón"} más y{" "}
                  {falta === 1 ? `pagás ${money(b.total - b.singles * PRECIOS.individual + PRECIOS.comboPrecio)} en total` : "armás un combo"}{" "}
                  ({PRECIOS.comboCantidad} por {money(PRECIOS.comboPrecio)}).
                </div>
              )}

              <form className="form" onSubmit={pay}>
                <div className="field">
                  <label htmlFor="name">Nombre y apellido</label>
                  <input id="name" className="input" required autoComplete="name" value={form.name} onChange={set("name")} />
                </div>
                <div className="field">
                  <label htmlFor="dni">DNI</label>
                  <input id="dni" className="input" required inputMode="numeric" value={form.dni} onChange={set("dni")} />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" className="input" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
                </div>
                <div className="field">
                  <label htmlFor="phone">Teléfono / WhatsApp</label>
                  <input id="phone" className="input" type="tel" required autoComplete="tel" value={form.phone} onChange={set("phone")} />
                </div>
                <label className="check">
                  <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
                  Soy mayor de 18 años y acepto las bases del sorteo.
                </label>
                {error && <div className="form-error">{error}</div>}
                <button className="btn btn-gold btn-block" type="submit" disabled={sending || !accepted}>
                  {sending ? "Conectando con Mercado Pago…" : `Pagar ${money(b.total)} con Mercado Pago`}
                </button>
                <div className="mp-note">🔒 Pago seguro procesado por Mercado Pago</div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
