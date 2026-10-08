import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csv(rows: string[], name: string) {
  const today = new Date().toISOString().slice(0, 10);
  return new Response("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Una fila por chance del sorteo de referidos (numeradas, para sortear). */
async function referrals() {
  const { data, error } = await db().rpc("referral_ranking");
  if (error) return new Response(error.message, { status: 500 });
  const rows = [["Chance Nº", "Quién invitó", "DNI", "Email", "Teléfono", "Amigos que compraron"].join(";")];
  let n = 1;
  for (const r of (data ?? []) as { name: string; dni: string; email: string; phone: string; chances: number }[]) {
    for (let i = 0; i < r.chances; i++) {
      rows.push([n++, r.name, r.dni, r.email, r.phone, r.chances].map(cell).join(";"));
    }
  }
  return csv(rows, "referidos");
}

/** Descarga un archivo para Excel con una fila por cartón vendido. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  if (new URL(req.url).searchParams.get("tipo") === "referidos") return referrals();

  const { data, error } = await db()
    .from("orders")
    .select("id,paid_at,buyer_name,buyer_dni,buyer_email,buyer_phone,ticket_codes,total,status,mp_payment_id")
    .in("status", ["paid", "conflict"])
    .order("paid_at");
  if (error) return new Response(error.message, { status: 500 });

  const header = ["Cartón", "Comprador", "DNI", "Email", "Teléfono", "Fecha de pago", "Total del pedido", "Estado", "Pago", "ID pedido"];
  const rows = [header.join(";")];
  for (const o of data ?? []) {
    const fecha = o.paid_at
      ? new Date(o.paid_at).toLocaleString("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
          dateStyle: "short",
          timeStyle: "short",
          hourCycle: "h23",
        })
      : "";
    for (const code of o.ticket_codes as string[]) {
      rows.push(
        [code, o.buyer_name, o.buyer_dni, o.buyer_email, o.buyer_phone, fecha, o.total,
          o.status === "paid" ? "Pagado" : "Revisar", o.mp_payment_id, o.id].map(cell).join(";"),
      );
    }
  }

  return csv(rows, "compradores");
}
