import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import { db, postgresUrls } from "./supabase.ts";

// Subir este número cada vez que cambie supabase/schema.sql (y su función schema_version()).
export const SCHEMA_VERSION = 2;

let verified = false;

async function currentVersion(): Promise<number | null> {
  const { data, error } = await db().rpc("schema_version");
  return error ? null : Number(data);
}

/** Ejecuta supabase/schema.sql usando la conexión directa a Postgres. */
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

/**
 * Crea o actualiza las tablas si la base está vacía o tiene una versión vieja.
 * Así, al publicar cambios, la base de datos se actualiza sola.
 */
export async function ensureSchema(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (verified) return { ok: true };
  const version = await currentVersion();
  if (version !== null && version >= SCHEMA_VERSION) {
    verified = true;
    return { ok: true };
  }

  const urls = postgresUrls();
  if (urls.length === 0) {
    return {
      ok: false,
      error:
        "La base de datos necesita actualizarse y no hay conexión directa (POSTGRES_URL). Ejecutá supabase/schema.sql en Supabase.",
    };
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
  if (lastError) return { ok: false, error: `Error actualizando la base de datos: ${lastError.message}` };

  // Supabase tarda un instante en "ver" las tablas y funciones nuevas.
  for (let i = 0; i < 10; i++) {
    const v = await currentVersion();
    if (v !== null && v >= SCHEMA_VERSION) {
      verified = true;
      return { ok: true };
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { ok: false, error: "La base de datos se actualizó. Esperá unos segundos y recargá la página." };
}
