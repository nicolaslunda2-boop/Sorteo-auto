import { db, isConfigured } from "@/lib/supabase";
import { fail, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isConfigured()) return fail("La base de datos todavía no está configurada.", 503);
  const body = await req.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.numbers) ? body.numbers : [];
  const numbers = [...new Set(raw.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 90))];
  if (numbers.length === 0) return fail("Elegí al menos un número del 1 al 90.");
  if (numbers.length > 15) return fail("Podés elegir hasta 15 números.");

  const { data, error } = await db().rpc("search_favorites", { p_numbers: numbers, p_limit: 24 });
  if (error) return fail(error.message, 500);
  const tickets = (data as { id: number; code: string; grid: number[]; matches: number }[]).map((t) => ({
    ...t,
    status: "available",
  }));
  return json({ tickets, numbers });
}
