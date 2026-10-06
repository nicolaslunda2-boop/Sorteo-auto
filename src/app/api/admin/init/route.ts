import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { Client } from "pg";
import { isAdmin } from "@/lib/admin-auth";
import { db, isConfigured, postgresUrls } from "@/lib/supabase";
import { generateCards } from "@/lib/bingo";
import { SEMILLA_CARTONES, TOTAL_TICKETS } from "@/lib/config";
import { ticketCode } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Crea (o actualiza) las tablas usando la conexión directa a Postgres. */
async function runSchema(connectionString: string, sql: string) {
  const u = new URL(connectionString);
  const local = ["localhost", "127.0.0.1"].includes(u.hostname);
  // Supabase usa SSL; quitamos sslmode de la URL para poder configurarlo acá.
  u.searchParams.delete("sslmode");
  u.searchParams.delete("supa");
  const client = new Client({
    connectionString: u.toString(),
    ssl: local ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

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

  let count = await ticketCount();
  if (count === null) {
    const urls = postgresUrls();
    if (urls.length === 0) {
      return done(
        "Error: la base de datos no tiene las tablas. Conectá Supabase desde Vercel (Storage) o ejecutá supabase/schema.sql en Supabase.",
      );
    }
    const sql = await fs.readFile(path.join(process.cwd(), "supabase", "schema.sql"), "utf8");
    let lastError: Error | null = null;
    for (const pg of urls) {
      try {
        await runSchema(pg, sql);
        lastError = null;
        break;
      } catch (e) {
        console.error(e);
        lastError = e as Error;
      }
    }
    if (lastError) return done(`Error creando las tablas: ${lastError.message}`);
    // Supabase tarda un instante en "ver" las tablas nuevas.
    for (let i = 0; i < 10 && count === null; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      count = await ticketCount();
    }
    if (count === null) return done("Las tablas se crearon. Esperá unos segundos y tocá el botón otra vez.");
  }

  if (count > 0) return done(`Todo listo: la web ya tiene ${count} cartones.`);

  const cards = generateCards(TOTAL_TICKETS, SEMILLA_CARTONES);
  const rows = cards.map((c, i) => ({ id: i + 1, code: ticketCode(i + 1), grid: c.grid, numbers: c.numbers }));
  for (let i = 0; i < rows.length; i += 1000) {
    const { error: e } = await db().from("tickets").insert(rows.slice(i, i + 1000));
    if (e) return done(`Error creando cartones: ${e.message ?? e.code ?? "desconocido"}`);
  }
  return done(`¡Listo! Se crearon ${rows.length} cartones. Ya podés vender.`);
}
