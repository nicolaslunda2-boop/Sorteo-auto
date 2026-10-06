import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Acepta los nombres que carga la integración de Supabase en Vercel y los manuales.
function url() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}
function key() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export function isConfigured(): boolean {
  return Boolean(url() && key());
}

/** Cliente con la clave secreta. Solo se usa en el servidor, nunca en el navegador. */
export function db(): SupabaseClient {
  if (!client) {
    const u = url();
    const k = key();
    if (!u || !k) throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    client = createClient(u, k, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

/** Conexiones a Postgres que carga la integración de Vercel. Se usan solo para crear las tablas. */
export function postgresUrls(): string[] {
  const list = [process.env.POSTGRES_URL, process.env.POSTGRES_URL_NON_POOLING, process.env.DATABASE_URL];
  return [...new Set(list.filter((u): u is string => Boolean(u)))];
}
