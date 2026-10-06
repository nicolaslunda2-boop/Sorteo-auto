import { processPayment, verifyWebhookSignature } from "@/lib/mercadopago";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

// Mercado Pago avisa acá cada vez que cambia el estado de un pago.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));

  const type = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId =
    url.searchParams.get("data.id") ?? (body?.data?.id != null ? String(body.data.id) : null) ?? url.searchParams.get("id");

  if (type !== "payment" || !dataId) return json({ ignored: true });

  const valid = verifyWebhookSignature({
    signature: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId: url.searchParams.get("data.id") ?? dataId,
  });
  if (!valid) return json({ error: "firma inválida" }, 401);

  try {
    const result = await processPayment(dataId);
    return json({ ok: true, result });
  } catch (e) {
    console.error("Webhook Mercado Pago:", e);
    // 500 hace que Mercado Pago reintente más tarde.
    return json({ error: "error procesando el pago" }, 500);
  }
}

export async function GET() {
  return json({ ok: true });
}
