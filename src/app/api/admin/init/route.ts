import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { db, isConfigured } from "@/lib/supabase";
import { ensureSchema } from "@/lib/migrate";
import { generateCards } from "@/lib/bingo";
import { SEMILLA_CARTONES, TOTAL_TICKETS } from "@/lib/config";
import { ticketCode } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function ticketCount(): Promise<number | null> {
  // Consulta normal (no "head"): así un error de tabla inexistente sí se detecta.
  const { count, error } = await db().from("tickets").select("id", { count: "exact" }).limit(1);
  return error || count === null ? null : count;
}

/**
 * "Preparar la web": crea las tablas si hace falta y después los 6000 cartones
 * (solo si todavía no existen). Se puede tocar más de una vez sin problema.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  const back = new URL("/admin", req.url);
  const done = (msg: string) => {
    back.searchParams.set("msg", msg);
    return NextResponse.redirect(back, 303);
  };

  if (!isConfigured()) return done("Error: faltan las variables de Supabase en Vercel.");

  const schema = await ensureSchema();
  if (!schema.ok) return done(schema.error);
  const count = await ticketCount();
  if (count === null) return done("La base de datos todavía no responde. Esperá unos segundos y tocá el botón otra vez.");

  if (count > 0) return done(`Todo listo: la web ya tiene ${count} cartones.`);

  const cards = generateCards(TOTAL_TICKETS, SEMILLA_CARTONES);
  const rows = cards.map((c, i) => ({ id: i + 1, code: ticketCode(i + 1), grid: c.grid, numbers: c.numbers }));
  for (let i = 0; i < rows.length; i += 1000) {
    const { error: e } = await db().from("tickets").insert(rows.slice(i, i + 1000));
    if (e) return done(`Error creando cartones: ${e.message ?? e.code ?? "desconocido"}`);
  }
  return done(`¡Listo! Se crearon ${rows.length} cartones. Ya podés vender.`);
}
