import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Confirmar o cancelar a mano un pedido pagado por transferencia. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  const { id } = await ctx.params;
  const form = await req.formData();
  const action = String(form.get("action") ?? "");
  const back = new URL("/admin", req.url);
  const done = (msg: string) => {
    back.searchParams.set("msg", msg);
    return NextResponse.redirect(back, 303);
  };

  const { data: order, error } = await db()
    .from("orders")
    .select("id,status,total,ticket_codes,buyer_name")
    .eq("id", id)
    .maybeSingle();
  if (error || !order) return done("No se encontró el pedido.");
  if (order.status !== "pending") return done("Ese pedido ya estaba resuelto.");

  if (action === "confirm") {
    const { data, error: e } = await db().rpc("confirm_order", {
      p_order_id: id,
      p_payment_id: "transferencia",
      p_amount: order.total,
    });
    if (e) return done(`Error: ${e.message}`);
    if (data === "conflict") {
      return done(
        `Atención: ${order.buyer_name} pagó, pero algún cartón ya se había vendido a otra persona (la reserva había vencido). Quedó marcado como "Revisar".`,
      );
    }
    return done(`✓ Pago confirmado: ${order.ticket_codes.join(", ")} vendidos a ${order.buyer_name}.`);
  }

  if (action === "cancel") {
    await db()
      .from("tickets")
      .update({ status: "available", reserved_by: null, reserved_until: null, order_id: null })
      .eq("order_id", id)
      .eq("status", "reserved");
    await db().from("orders").update({ status: "rejected", mp_status: "cancelado" }).eq("id", id).eq("status", "pending");
    return done(`Reserva cancelada: ${order.ticket_codes.join(", ")} vuelven a estar disponibles.`);
  }

  return done("Acción desconocida.");
}
