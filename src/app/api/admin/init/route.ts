import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { generateCards } from "@/lib/bingo";
import { SEMILLA_CARTONES, TOTAL_TICKETS } from "@/lib/config";
import { ticketCode } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Crea los 6000 cartones (solo si la tabla está vacía). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  const back = new URL("/admin", req.url);

  const { count, error } = await db().from("tickets").select("id", { count: "exact", head: true });
  if (error) return new Response(error.message, { status: 500 });
  if ((count ?? 0) > 0) {
    back.searchParams.set("msg", "Los cartones ya estaban creados.");
    return NextResponse.redirect(back, 303);
  }

  const cards = generateCards(TOTAL_TICKETS, SEMILLA_CARTONES);
  const rows = cards.map((c, i) => ({ id: i + 1, code: ticketCode(i + 1), grid: c.grid, numbers: c.numbers }));
  for (let i = 0; i < rows.length; i += 1000) {
    const { error: e } = await db().from("tickets").insert(rows.slice(i, i + 1000));
    if (e) return new Response(`Error creando cartones: ${e.message}`, { status: 500 });
  }

  back.searchParams.set("msg", `Listo: se crearon ${rows.length} cartones.`);
  return NextResponse.redirect(back, 303);
}
