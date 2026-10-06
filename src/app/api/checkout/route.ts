import { db, isConfigured } from "@/lib/supabase";
import { fail, json, validSession } from "@/lib/api";
import { PRECIOS, RESERVA_MINUTOS, TRANSFERENCIA_HORAS } from "@/lib/config";
import { createPreference } from "@/lib/mercadopago";
import { paymentOptions } from "@/lib/payments";

export const dynamic = "force-dynamic";

function clean(v: unknown, max = 120): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

export async function POST(req: Request) {
  if (!isConfigured()) return fail("La base de datos todavía no está configurada.", 503);
  const body = await req.json().catch(() => null);
  const options = paymentOptions();
  const method = body?.method === "mercadopago" ? "mercadopago" : "transfer";
  if (!options[method]) {
    if (!options.transfer && !options.mercadopago) return fail("Todavía no hay medios de pago configurados.", 503);
    return fail("Ese medio de pago no está disponible.", 400);
  }

  const session = body?.session;
  const name = clean(body?.name);
  const dni = clean(body?.dni, 20).replace(/\D/g, "");
  const email = clean(body?.email).toLowerCase();
  const phone = clean(body?.phone, 30);

  if (!validSession(session)) return fail("Sesión inválida.");
  if (name.length < 3) return fail("Ingresá tu nombre y apellido.");
  if (dni.length < 7 || dni.length > 9) return fail("Ingresá un DNI válido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Ingresá un email válido.");
  if (phone.replace(/\D/g, "").length < 8) return fail("Ingresá un teléfono válido.");

  const { data, error } = await db().rpc("create_order", {
    p_session: session,
    p_name: name,
    p_dni: dni,
    p_email: email,
    p_phone: phone,
    p_price_single: PRECIOS.individual,
    p_combo_size: PRECIOS.comboCantidad,
    p_combo_price: PRECIOS.comboPrecio,
    p_minutes: method === "transfer" ? TRANSFERENCIA_HORAS * 60 : RESERVA_MINUTOS,
    p_method: method,
  });
  if (error) {
    if (error.message.includes("EMPTY_CART")) {
      return fail("Tu reserva venció. Volvé a elegir tus cartones.", 409);
    }
    return fail(error.message, 500);
  }

  const order = (data as { order_id: string; ticket_codes: string[]; total: number; expires_at: string }[])[0];

  if (method === "transfer") {
    return json({ orderId: order.order_id, url: `/compra/resultado?order=${order.order_id}` });
  }

  try {
    const pref = await createPreference({
      orderId: order.order_id,
      codes: order.ticket_codes,
      total: order.total,
      email,
      name,
      expiresAt: new Date(order.expires_at).toISOString().replace("Z", "-00:00"),
    });
    await db().from("orders").update({ mp_preference_id: pref.id }).eq("id", order.order_id);
    return json({ orderId: order.order_id, url: pref.url });
  } catch (e) {
    console.error(e);
    return fail("No pudimos conectar con Mercado Pago. Probá de nuevo en unos segundos.", 502);
  }
}
