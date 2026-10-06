import "server-only";
import crypto from "node:crypto";
import { SORTEO } from "./config.ts";
import { siteUrl } from "./site.ts";
import { db } from "./supabase.ts";

const API = "https://api.mercadopago.com";

function token(): string {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("Falta MP_ACCESS_TOKEN");
  return t;
}

type PreferenceInput = {
  orderId: string;
  codes: string[];
  total: number;
  email: string;
  name: string;
  expiresAt: string;
};

export async function createPreference(input: PreferenceInput): Promise<{ id: string; url: string }> {
  const base = siteUrl();
  const back = `${base}/compra/resultado?order=${input.orderId}`;
  const isLocal = base.includes("localhost");

  const body = {
    items: [
      {
        id: input.orderId,
        title: `${SORTEO.titulo} — ${input.codes.length} cartón(es)`,
        description: input.codes.join(", ").slice(0, 250),
        quantity: 1,
        currency_id: "ARS",
        unit_price: input.total,
      },
    ],
    payer: { email: input.email, name: input.name },
    external_reference: input.orderId,
    back_urls: { success: back, failure: back, pending: back },
    ...(isLocal ? {} : { auto_return: "approved", notification_url: `${base}/api/webhooks/mercadopago` }),
    // Sin pagos en efectivo (tardan días y la reserva dura minutos).
    payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }] },
    expires: true,
    expiration_date_to: input.expiresAt,
    statement_descriptor: "SORTEO AUTO",
  };

  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.orderId,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago: ${data?.message ?? res.status}`);
  return { id: data.id, url: data.init_point };
}

type Payment = {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
};

export async function getPayment(paymentId: string): Promise<Payment> {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago: ${data?.message ?? res.status}`);
  return data as Payment;
}

/**
 * Consulta el pago a Mercado Pago (nunca confiamos en lo que llega por la URL)
 * y actualiza el pedido. Se usa desde el webhook y desde la página de resultado.
 */
export async function processPayment(paymentId: string): Promise<string> {
  const payment = await getPayment(paymentId);
  const orderId = payment.external_reference;
  if (!orderId) return "no_reference";

  if (payment.status === "approved") {
    const { data, error } = await db().rpc("confirm_order", {
      p_order_id: orderId,
      p_payment_id: String(payment.id),
      p_amount: payment.transaction_amount,
    });
    if (error) throw error;
    return data as string;
  }

  if (payment.status === "rejected" || payment.status === "cancelled") {
    await db()
      .from("orders")
      .update({ status: "rejected", mp_payment_id: String(payment.id), mp_status: payment.status })
      .eq("id", orderId)
      .eq("status", "pending");
    return "rejected";
  }

  await db()
    .from("orders")
    .update({ mp_payment_id: String(payment.id), mp_status: payment.status })
    .eq("id", orderId)
    .eq("status", "pending");
  return payment.status;
}

/** Verifica la firma "x-signature" que envía Mercado Pago en cada webhook. */
export function verifyWebhookSignature(opts: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Sin clave configurada no se puede verificar.
  if (!opts.signature) return false;

  const parts = Object.fromEntries(
    opts.signature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  let manifest = "";
  if (opts.dataId) manifest += `id:${/^[a-z0-9]+$/i.test(opts.dataId) ? opts.dataId.toLowerCase() : opts.dataId};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${ts};`;

  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
