import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { ensureSchema } from "@/lib/migrate";
import { PRECIOS } from "@/lib/config";
import { parseTicketQuery } from "@/lib/tickets";

export const dynamic = "force-dynamic";

/** "A-0012, 345 a-0999" → [12, 345, 999]. Devuelve null si algún número no es válido. */
function parseCodes(raw: string): number[] | null {
  const parts = raw.split(/[\s,;]+/).filter(Boolean);
  const ids = parts.map(parseTicketQuery);
  if (ids.some((n) => n === null)) return null;
  return [...new Set(ids as number[])];
}

/** Cartones apartados para vender en persona: apartar, liberar y registrar ventas. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  const form = await req.formData();
  const action = String(form.get("action") ?? "");
  const back = new URL("/admin", req.url);
  back.hash = "apartados";
  const done = (msg: string) => {
    back.searchParams.set("msg", msg);
    return NextResponse.redirect(back, 303);
  };

  const schema = await ensureSchema();
  if (!schema.ok) return done(schema.error);

  if (action === "hold") {
    const count = Math.floor(Number(form.get("count")));
    if (!Number.isFinite(count) || count < 1 || count > 6000) return done("Poné una cantidad entre 1 y 6000.");
    const { data, error } = await db().rpc("hold_random_tickets", { p_count: count });
    if (error) return done(`Error: ${error.message}`);
    return done(`Listo: se apartaron ${data} cartones al azar para vender en persona.`);
  }

  if (action === "release") {
    const raw = String(form.get("codes") ?? "").trim();
    const all = form.get("all") === "1";
    let ids: number[] | null = null;
    if (!all) {
      ids = parseCodes(raw);
      if (!ids || ids.length === 0) return done("Escribí los números de cartón a liberar (ej: A-0012, A-0345).");
    }
    const { data, error } = await db().rpc("release_held", { p_ids: ids });
    if (error) return done(`Error: ${error.message}`);
    return done(`Se liberaron ${data} cartones: vuelven a estar a la venta online.`);
  }

  if (action === "sell") {
    const ids = parseCodes(String(form.get("codes") ?? ""));
    const name = String(form.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
    const dni = String(form.get("dni") ?? "").replace(/\D/g, "").slice(0, 12);
    const phone = String(form.get("phone") ?? "").trim().slice(0, 30);
    const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 120);
    if (!ids || ids.length === 0) return done("Escribí los números de cartón vendidos (ej: A-0012, A-0345).");
    if (name.length < 3 || dni.length < 7 || phone.replace(/\D/g, "").length < 8) {
      return done("Completá nombre, DNI y teléfono del comprador.");
    }
    const { data, error } = await db().rpc("sell_in_person", {
      p_ids: ids,
      p_name: name,
      p_dni: dni,
      p_email: email,
      p_phone: phone,
      p_price_single: PRECIOS.individual,
      p_combo_size: PRECIOS.comboCantidad,
      p_combo_price: PRECIOS.comboPrecio,
    });
    if (error) {
      if (error.message.includes("NOT_AVAILABLE")) {
        return done("Algún cartón de la lista ya está vendido o reservado online. Revisá los números.");
      }
      return done(`Error: ${error.message}`);
    }
    const order = (data as { order_id: string; ticket_codes: string[]; total: number }[])[0];
    const link = `${new URL(req.url).origin}/compra/resultado?order=${order.order_id}`;
    const total = new Intl.NumberFormat("es-AR").format(order.total);
    return done(
      `✓ Venta registrada: ${order.ticket_codes.join(", ")} a ${name} ($${total}). Mandale este link para que descargue sus cartones: ${link}`,
    );
  }

  return done("Acción desconocida.");
}
