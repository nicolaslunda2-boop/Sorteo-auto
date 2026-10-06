"use client";

import { useEffect, useState } from "react";
import { BingoCard } from "./BingoCard";
import { SORTEO } from "@/lib/config";
import { canShareImages, downloadImage, shareImage, ticketsToPng, type TicketForImage } from "@/lib/ticket-image";

const ORDERS_KEY = "sorteo-pedidos";

/** Recuerda en este celular/computadora los pedidos pagados, para "Mis cartones". */
export function rememberOrder(orderId: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "[]");
    if (!list.includes(orderId)) localStorage.setItem(ORDERS_KEY, JSON.stringify([orderId, ...list].slice(0, 50)));
  } catch {
    /* sin almacenamiento disponible */
  }
}

export function rememberedOrders(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function PurchasedTickets({ tickets, holder }: { tickets: TicketForImage[]; holder: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  useEffect(() => setShare(canShareImages()), []);

  async function run(key: string, list: TicketForImage[], mode: "download" | "share") {
    setBusy(key);
    try {
      const blob = await ticketsToPng(list, holder);
      const name = list.length === 1 ? `carton-${list[0].code}.png` : `mis-cartones-${list.length}.png`;
      if (mode === "share") {
        await shareImage(blob, name, `Mis cartones del ${SORTEO.titulo}: ${list.map((t) => t.code).join(", ")}`);
      } else {
        downloadImage(blob, name);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="admin-actions" style={{ justifyContent: "center" }}>
        <button className="btn btn-gold" disabled={busy !== null} onClick={() => run("all", tickets, "download")}>
          {busy === "all" ? "Preparando…" : tickets.length === 1 ? "⬇ Descargar mi cartón" : `⬇ Descargar mis ${tickets.length} cartones`}
        </button>
        {share && (
          <button className="btn btn-ghost" disabled={busy !== null} onClick={() => run("share", tickets, "share")}>
            {busy === "share" ? "Preparando…" : "Compartir / WhatsApp"}
          </button>
        )}
      </div>
      <div className="cart-items" style={{ textAlign: "left", marginTop: 20 }}>
        {tickets.map((t) => (
          <BingoCard
            key={t.code}
            code={t.code}
            grid={t.grid}
            inCart
            footer={
              <>
                <span className="ticket-price">
                  <small>Titular</small>
                  {holder}
                </span>
                {tickets.length > 1 && (
                  <button className="btn btn-sm btn-ink" disabled={busy !== null} onClick={() => run(t.code, [t], "download")}>
                    {busy === t.code ? "…" : "⬇ Descargar"}
                  </button>
                )}
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}
