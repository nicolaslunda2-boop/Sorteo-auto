"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PurchasedTickets, rememberedOrders } from "@/components/PurchasedTickets";
import { ReferralBox } from "@/components/ReferralBox";
import { money } from "@/lib/pricing";

type Order = {
  id: string;
  status: string;
  method: string;
  name: string;
  total: number;
  codes: string[];
  tickets: { code: string; grid: number[] }[];
  referral: { code: string; friends: number } | null;
};

export default function MisCartonesPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const ids = rememberedOrders();
    Promise.all(
      ids.map((id) =>
        fetch(`/api/orders/${id}`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((o) => (o ? { ...o, id } : null))
          .catch(() => null),
      ),
    ).then((list) => setOrders(list.filter((o): o is Order => Boolean(o))));
  }, []);

  const paid = orders?.filter((o) => o.tickets?.length) ?? [];
  const referral = paid.find((o) => o.referral)?.referral ?? null;
  const waiting = orders?.filter((o) => o.status === "pending" && o.method === "transfer") ?? [];

  return (
    <div className="page">
      <div className="container">
        <div className="kicker">Tus compras</div>
        <h1 className="page-title">Mis cartones</h1>
        {orders === null && <div className="empty">Cargando…</div>}

        {waiting.map((o) => (
          <div key={o.id} className="hint" style={{ marginBottom: 16 }}>
            Reserva <b>{o.codes.join(", ")}</b> por {money(o.total)}: esperando la confirmación de tu transferencia.{" "}
            <Link href={`/compra/resultado?order=${o.id}`}>Ver datos para transferir</Link>
          </div>
        ))}

        {orders && paid.length === 0 && waiting.length === 0 && (
          <div className="empty">
            <p style={{ marginTop: 0 }}>
              No encontramos cartones comprados desde este dispositivo. Si compraste desde otro celular, abrí ahí esta
              misma página.
            </p>
            <Link href="/#cartones" className="btn btn-gold">
              Elegir cartones
            </Link>
          </div>
        )}
        {referral && <ReferralBox code={referral.code} friends={referral.friends} />}
        {paid.map((o) => (
          <div key={o.id} style={{ marginBottom: 40 }}>
            <PurchasedTickets tickets={o.tickets} holder={o.name} />
          </div>
        ))}
      </div>
    </div>
  );
}
