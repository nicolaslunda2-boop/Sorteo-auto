"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PurchasedTickets, rememberedOrders } from "@/components/PurchasedTickets";

type Order = { status: string; name: string; tickets: { code: string; grid: number[] }[] };

export default function MisCartonesPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const ids = rememberedOrders();
    Promise.all(
      ids.map((id) =>
        fetch(`/api/orders/${id}`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((list) => setOrders(list.filter((o): o is Order => Boolean(o && o.tickets?.length))));
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div className="kicker">Tus compras</div>
        <h1 className="page-title">Mis cartones</h1>
        {orders === null && <div className="empty">Cargando…</div>}
        {orders && orders.length === 0 && (
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
        {orders?.map((o, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <PurchasedTickets tickets={o.tickets} holder={o.name} />
          </div>
        ))}
      </div>
    </div>
  );
}
