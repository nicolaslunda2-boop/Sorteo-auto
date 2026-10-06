"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { PurchasedTickets, rememberOrder } from "@/components/PurchasedTickets";
import { money } from "@/lib/pricing";

type Order = {
  status: "pending" | "paid" | "rejected" | "conflict";
  codes: string[];
  total: number;
  name: string;
  firstName: string;
  tickets: { code: string; grid: number[] }[];
};

function Resultado() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? params.get("external_reference");
  const paymentId = params.get("payment_id") ?? params.get("collection_id");
  const mpStatus = params.get("status") ?? params.get("collection_status");
  const { refresh } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let stop = false;
    const qs = paymentId && paymentId !== "null" ? `?payment_id=${paymentId}` : "";
    fetch(`/api/orders/${orderId}${qs}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (stop) return;
        if (!res.ok) setError(data.error ?? "No encontramos tu pedido.");
        else setOrder(data);
      })
      .catch(() => !stop && setError("Sin conexión."));
    return () => {
      stop = true;
    };
  }, [orderId, paymentId, tries]);

  // Mientras esté pendiente, volvemos a consultar cada 4 segundos (hasta ~2 minutos).
  useEffect(() => {
    if (order?.status !== "pending" || tries > 30) return;
    const t = setTimeout(() => setTries((n) => n + 1), 4000);
    return () => clearTimeout(t);
  }, [order, tries]);

  useEffect(() => {
    if (order && order.status !== "pending") refresh();
    if (orderId && (order?.status === "paid" || order?.status === "conflict")) rememberOrder(orderId);
  }, [order, orderId, refresh]);

  if (!orderId) return <div className="empty">No encontramos datos de la compra.</div>;
  if (error) return <div className="notice notice-error">{error}</div>;
  if (!order) return <div className="empty">Verificando tu pago…</div>;

  if (order.status === "paid") {
    return (
      <div className="result">
        <div className="result-icon ok">✓</div>
        <div className="kicker">Pago acreditado</div>
        <h1 className="page-title">¡Felicitaciones, {order.firstName}!</h1>
        <p className="muted">
          Ya participás del sorteo. Total pagado: {money(order.total)}. Descargá {order.codes.length === 1 ? "tu cartón" : "tus cartones"}{" "}
          y guardalo{order.codes.length === 1 ? "" : "s"} en el celular. ¡Mucha suerte!
        </p>
        <PurchasedTickets tickets={order.tickets} holder={order.name} />
        <p className="muted" style={{ marginTop: 28, fontSize: ".9rem" }}>
          Podés volver a verlos cuando quieras desde <Link href="/mis-cartones">Mis cartones</Link> (en este mismo
          celular) o guardando el enlace de esta página.
        </p>
      </div>
    );
  }

  if (order.status === "conflict") {
    return (
      <div className="result">
        <div className="result-icon wait">!</div>
        <h1 className="page-title">Recibimos tu pago</h1>
        <p className="muted">
          Pero alguno de tus cartones ya había sido vendido mientras pagabas. Nos vamos a comunicar con vos para
          asignarte otro cartón o devolverte el dinero.
        </p>
      </div>
    );
  }

  if (order.status === "rejected" || mpStatus === "rejected" || mpStatus === "failure") {
    return (
      <div className="result">
        <div className="result-icon bad">✕</div>
        <h1 className="page-title">El pago no se completó</h1>
        <p className="muted">No se realizó ningún cobro. Si tu reserva sigue vigente podés intentarlo de nuevo.</p>
        <Link href="/carrito" className="btn btn-gold">
          Volver a intentar
        </Link>
      </div>
    );
  }

  return (
    <div className="result">
      <div className="result-icon wait">⏱</div>
      <h1 className="page-title">Estamos confirmando tu pago</h1>
      <p className="muted">
        Esto suele tardar unos segundos. Esta página se actualiza sola. Si ya pagaste, quedate tranquilo: apenas Mercado
        Pago lo acredite, tus cartones quedan a tu nombre.
      </p>
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <div className="page">
      <div className="container">
        <Suspense fallback={<div className="empty">Cargando…</div>}>
          <Resultado />
        </Suspense>
      </div>
    </div>
  );
}
