import { db, isConfigured } from "@/lib/supabase";
import { fail, json, validSession } from "@/lib/api";
import { MAX_TICKETS_POR_PERSONA, RESERVA_MINUTOS } from "@/lib/config";

export const dynamic = "force-dynamic";

async function cartFor(session: string) {
  const { data, error } = await db()
    .from("tickets")
    .select("id,code,grid,reserved_until")
    .eq("reserved_by", session)
    .eq("status", "reserved")
    .gt("reserved_until", new Date().toISOString())
    .order("id");
  if (error) throw error;
  return data;
}

/** Cartones reservados por esta persona. */
export async function GET(req: Request) {
  if (!isConfigured()) return json({ items: [] });
  const session = new URL(req.url).searchParams.get("session");
  if (!validSession(session)) return fail("Sesión inválida.");
  try {
    return json({ items: await cartFor(session) });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

/** Reserva un cartón por 15 minutos. */
export async function POST(req: Request) {
  if (!isConfigured()) return fail("La base de datos todavía no está configurada.", 503);
  const body = await req.json().catch(() => null);
  const session = body?.session;
  const ticketId = Number(body?.ticketId);
  if (!validSession(session) || !Number.isInteger(ticketId)) return fail("Datos inválidos.");

  const { data, error } = await db().rpc("reserve_ticket", {
    p_ticket_id: ticketId,
    p_session: session,
    p_minutes: RESERVA_MINUTOS,
    p_max: MAX_TICKETS_POR_PERSONA,
  });
  if (error) {
    if (error.message.includes("LIMIT_REACHED")) {
      return fail(`Podés reservar hasta ${MAX_TICKETS_POR_PERSONA} cartones por compra.`, 409);
    }
    return fail(error.message, 500);
  }
  if (!data || data.length === 0) {
    return fail("Ese cartón acaba de ser reservado o vendido. Elegí otro.", 409);
  }
  return json({ items: await cartFor(session) });
}

/** Quita un cartón del carrito y lo libera. */
export async function DELETE(req: Request) {
  if (!isConfigured()) return fail("La base de datos todavía no está configurada.", 503);
  const body = await req.json().catch(() => null);
  const session = body?.session;
  const ticketId = Number(body?.ticketId);
  if (!validSession(session) || !Number.isInteger(ticketId)) return fail("Datos inválidos.");

  const { error } = await db()
    .from("tickets")
    .update({ status: "available", reserved_by: null, reserved_until: null, order_id: null })
    .eq("id", ticketId)
    .eq("reserved_by", session)
    .eq("status", "reserved");
  if (error) return fail(error.message, 500);
  return json({ items: await cartFor(session) });
}
