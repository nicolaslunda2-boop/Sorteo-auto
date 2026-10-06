import { db, isConfigured } from "@/lib/supabase";
import { fail, json } from "@/lib/api";
import { processPayment } from "@/lib/mercadopago";
import { transferInfo } from "@/lib/payments";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return fail("La base de datos todavía no está configurada.", 503);
  const { id } = await ctx.params;
  if (!UUID.test(id)) return fail("Pedido inválido.", 404);

  const read = () =>
    db().from("orders").select("id,status,ticket_codes,total,buyer_name,mp_payment_id,payment_method").eq("id", id).maybeSingle();

  let { data: order, error } = await read();
  if (error) return fail(error.message, 500);
  if (!order) return fail("Pedido no encontrado.", 404);

  // Si el webhook todavía no llegó, consultamos el pago directamente.
  const paymentId = new URL(req.url).searchParams.get("payment_id");
  if (order.status === "pending" && order.payment_method !== "transfer" && paymentId && /^\d+$/.test(paymentId)) {
    try {
      await processPayment(paymentId);
      ({ data: order } = await read());
    } catch (e) {
      console.error(e);
    }
  }
  if (!order) return fail("Pedido no encontrado.", 404);

  // Los cartones (con sus números) solo se entregan una vez pagados.
  let tickets: { code: string; grid: number[] }[] = [];
  if (order.status === "paid" || order.status === "conflict") {
    const { data } = await db()
      .from("tickets")
      .select("code,grid")
      .eq("order_id", id)
      .eq("status", "sold")
      .order("id");
    tickets = data ?? [];
  }

  // Transferencia pendiente: datos bancarios y hasta cuándo siguen apartados los cartones.
  let transfer = null;
  let expiresAt: string | null = null;
  if (order.status === "pending" && order.payment_method === "transfer") {
    transfer = transferInfo();
    const { data: held } = await db()
      .from("tickets")
      .select("reserved_until")
      .eq("order_id", id)
      .eq("status", "reserved")
      .order("reserved_until")
      .limit(1);
    expiresAt = held?.[0]?.reserved_until ?? null;
  }

  return json({
    status: order.status,
    method: order.payment_method,
    transfer,
    expiresAt,
    codes: order.ticket_codes,
    total: order.total,
    name: order.buyer_name,
    firstName: String(order.buyer_name).split(" ")[0],
    tickets,
  });
}
