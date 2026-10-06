import { db, isConfigured } from "@/lib/supabase";
import { fail, json } from "@/lib/api";
import { parseTicketQuery } from "@/lib/tickets";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export async function GET(req: Request) {
  if (!isConfigured()) return fail("La base de datos todavía no está configurada.", 503);
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const onlyAvailable = url.searchParams.get("filter") !== "all";
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);

  if (q) {
    const id = parseTicketQuery(q);
    if (!id) return json({ tickets: [], total: 0, page: 1, pageSize: PAGE_SIZE });
    const { data, error } = await db().from("tickets_public").select("id,code,grid,status").eq("id", id);
    if (error) return fail(error.message, 500);
    return json({ tickets: data, total: data.length, page: 1, pageSize: PAGE_SIZE });
  }

  const from = (page - 1) * PAGE_SIZE;
  let query = db()
    .from("tickets_public")
    .select("id,code,grid,status", { count: "exact" })
    .order("id")
    .range(from, from + PAGE_SIZE - 1);
  if (onlyAvailable) query = query.eq("status", "available");

  const { data, error, count } = await query;
  if (error) return fail(error.message, 500);
  return json({ tickets: data, total: count ?? 0, page, pageSize: PAGE_SIZE });
}
