import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Descarga un archivo para Excel con una fila por cartón vendido. */
export async function GET() {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });

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

  const today = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="compradores-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
