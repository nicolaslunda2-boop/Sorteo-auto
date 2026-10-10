import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import { db, isConfigured } from "@/lib/supabase";
import { money } from "@/lib/pricing";
import { ensureSchema } from "@/lib/migrate";
import { PREMIO_REFERIDOS } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración", robots: { index: false } };

type Stats = {
  total: number;
  sold: number;
  reserved: number;
  revenue: number;
  orders: number;
  conflicts: number;
  pending_transfers: number;
  held: number;
};
type Pending = {
  id: string;
  created_at: string;
  buyer_name: string;
  buyer_dni: string;
  buyer_phone: string;
  ticket_codes: string[];
  total: number;
};
type Order = {
  id: string;
  paid_at: string | null;
  created_at: string;
  buyer_name: string;
  buyer_dni: string;
  buyer_email: string;
  buyer_phone: string;
  ticket_codes: string[];
  total: number;
  status: "pending" | "paid" | "rejected" | "conflict";
  mp_payment_id: string | null;
};

const STATUS_LABEL: Record<Order["status"], string> = {
  paid: "Pagado",
  conflict: "Revisar",
  pending: "Pendiente",
  rejected: "Rechazado",
};

function fecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
  });
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;

  if (!process.env.ADMIN_PASSWORD) {
    return (
      <Shell>
        <div className="notice">
          Falta configurar la variable <code>ADMIN_PASSWORD</code> en Vercel para poder entrar al panel.
        </div>
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Shell>
        <form className="panel login" method="post" action="/api/admin/login">
          <h2>Ingresar</h2>
          <div className="form">
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input id="password" name="password" type="password" className="input" required autoFocus />
            </div>
            {params.error && <div className="form-error">Contraseña incorrecta.</div>}
            <button className="btn btn-gold btn-block" type="submit">
              Entrar
            </button>
          </div>
        </form>
      </Shell>
    );
  }

  if (!isConfigured()) {
    return (
      <Shell>
        <div className="notice notice-error">Faltan las variables de Supabase (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY).</div>
      </Shell>
    );
  }

  // Crea o actualiza las tablas si hace falta (por ejemplo, después de publicar cambios).
  const schema = await ensureSchema();
  if (!schema.ok) {
    return (
      <Shell>
        <div className="notice notice-error">{schema.error}</div>
      </Shell>
    );
  }

  const showAll = params.ver === "todos";
  const [{ data: stats, error: statsError }, { data: orders }, { data: pending }, { data: referrers }, heldCodes] = await Promise.all([
    db().rpc("raffle_stats"),
    (() => {
      let q = db()
        .from("orders")
        .select("id,paid_at,created_at,buyer_name,buyer_dni,buyer_email,buyer_phone,ticket_codes,total,status,mp_payment_id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!showAll) q = q.in("status", ["paid", "conflict"]);
      return q;
    })(),
    db()
      .from("orders")
      .select("id,created_at,buyer_name,buyer_dni,buyer_phone,ticket_codes,total")
      .eq("status", "pending")
      .eq("payment_method", "transfer")
      .order("created_at")
      .limit(300),
    db().rpc("referral_ranking"),
    heldTicketCodes(),
  ]);

  if (statsError) {
    return (
      <Shell>
        {params.msg && <div className="hint">{params.msg}</div>}
        <SetupPanel />
      </Shell>
    );
  }

  const s = stats as Stats;
  const available = s.total - s.sold - s.reserved - (s.held ?? 0);

  return (
    <Shell>
      {params.msg && <div className="hint">{params.msg}</div>}

      {s.total === 0 && <SetupPanel />}

      <div className="stats">
        <div className="stat">
          <small>Total recaudado</small>
          <strong>{money(s.revenue)}</strong>
        </div>
        <div className="stat">
          <small>Cartones vendidos</small>
          <strong>
            {s.sold.toLocaleString("es-AR")} <span className="muted" style={{ fontSize: "1rem" }}>/ {s.total.toLocaleString("es-AR")}</span>
          </strong>
        </div>
        <div className="stat">
          <small>Disponibles online</small>
          <strong>{available.toLocaleString("es-AR")}</strong>
        </div>
        <div className="stat">
          <small>Reservados ahora</small>
          <strong>{s.reserved.toLocaleString("es-AR")}</strong>
        </div>
      </div>

      {s.conflicts > 0 && (
        <div className="notice notice-error" style={{ marginBottom: 20, textAlign: "left" }}>
          Hay {s.conflicts} compra(s) marcadas como <b>Revisar</b>: la persona pagó, pero alguno de sus cartones ya se había
          vendido a otra persona mientras pagaba. Contactala para asignarle otro cartón o devolverle el dinero.
        </div>
      )}

      {pending && pending.length > 0 && <PendingTransfers list={pending as Pending[]} />}

      <HeldPanel codes={heldCodes} />

      <div className="admin-actions">
        <a className="btn btn-gold" href="/api/admin/export">
          ⬇ Descargar lista de compradores (Excel)
        </a>
        <a className="btn btn-ghost" href={showAll ? "/admin" : "/admin?ver=todos"}>
          {showAll ? "Ver solo pagados" : "Ver también pendientes y rechazados"}
        </a>
        <form method="post" action="/api/admin/logout">
          <button className="btn btn-ghost" type="submit">
            Salir
          </button>
        </form>
      </div>

      <h2 style={{ fontSize: "1.4rem", margin: "8px 0 14px" }}>
        {showAll ? "Todos los pedidos" : `Compras pagadas (${s.orders})`}
      </h2>
      {!orders || orders.length === 0 ? (
        <div className="empty">Todavía no hay compras.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Comprador</th>
                <th>DNI</th>
                <th>Contacto</th>
                <th>Cartones</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Pago</th>
              </tr>
            </thead>
            <tbody>
              {(orders as Order[]).map((o) => (
                <tr key={o.id} className={o.status === "conflict" ? "conflict" : ""}>
                  <td>{fecha(o.paid_at ?? o.created_at)}</td>
                  <td>{o.buyer_name}</td>
                  <td>{o.buyer_dni}</td>
                  <td>
                    {o.buyer_email}
                    <br />
                    <span className="muted">{o.buyer_phone}</span>
                  </td>
                  <td className="codes-cell">{o.ticket_codes.join(", ")}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    <span className={`pill ${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="muted">{o.mp_payment_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Referrals list={(referrers as Referrer[] | null) ?? []} />
    </Shell>
  );
}

type Referrer = { name: string; dni: string; phone: string; email: string; chances: number };

function Referrals({ list }: { list: Referrer[] }) {
  const total = list.reduce((n, r) => n + r.chances, 0);
  return (
    <div style={{ marginTop: 36 }}>
      <h2 style={{ fontSize: "1.4rem", margin: "8px 0 6px" }}>Sorteo de referidos ({PREMIO_REFERIDOS})</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Cada amigo distinto que compró y pagó con el link de alguien le da 1 chance. Total: {total}{" "}
        {total === 1 ? "chance" : "chances"} entre {list.length} {list.length === 1 ? "persona" : "personas"}.
      </p>
      {list.length === 0 ? (
        <div className="empty">Todavía nadie compró con un link de referido.</div>
      ) : (
        <>
          <div className="admin-actions">
            <a className="btn btn-ghost" href="/api/admin/export?tipo=referidos">
              ⬇ Descargar chances de referidos (Excel)
            </a>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Quién invitó</th>
                  <th>DNI</th>
                  <th>Contacto</th>
                  <th>Amigos que compraron (chances)</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.dni}>
                    <td>{r.name}</td>
                    <td>{r.dni}</td>
                    <td>
                      {r.email}
                      <br />
                      <span className="muted">{r.phone}</span>
                    </td>
                    <td>
                      <strong>{r.chances}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/** Números de los cartones apartados (Supabase entrega de a 1000 filas). */
async function heldTicketCodes(): Promise<string[]> {
  const codes: string[] = [];
  for (let from = 0; from < 6000; from += 1000) {
    const { data, error } = await db()
      .from("tickets")
      .select("code")
      .eq("status", "held")
      .order("id")
      .range(from, from + 999);
    if (error || !data) break;
    codes.push(...data.map((t) => t.code as string));
    if (data.length < 1000) break;
  }
  return codes;
}

function HeldPanel({ codes }: { codes: string[] }) {
  return (
    <div className="panel" id="apartados" style={{ marginBottom: 24 }}>
      <h2>Venta en persona ({codes.length} apartados)</h2>
      <p className="muted" style={{ marginTop: -6 }}>
        Los cartones apartados no se venden online (en la web figuran como &quot;Reservado&quot;) y <b>no cuentan como
        vendidos</b>. Cuando vendas uno en persona, registralo acá con los datos del comprador. Los que no vendas,
        liberalos antes del sorteo: un cartón apartado sin comprador no participa.
      </p>

      <div className="held-grid">
        <form method="post" action="/api/admin/held" className="held-box">
          <input type="hidden" name="action" value="hold" />
          <h3>Apartar cartones al azar</h3>
          <div className="field">
            <label htmlFor="hold-count">Cantidad</label>
            <input id="hold-count" name="count" type="number" min={1} max={6000} className="input" required placeholder="Ej: 100" />
          </div>
          <button className="btn btn-ghost btn-block" type="submit">
            Apartar al azar
          </button>
        </form>

        <form method="post" action="/api/admin/held" className="held-box">
          <input type="hidden" name="action" value="sell" />
          <h3>Registrar venta en persona</h3>
          <div className="field">
            <label htmlFor="sell-codes">Cartones vendidos</label>
            <input id="sell-codes" name="codes" className="input" required placeholder="Ej: A-0012, A-0345" />
          </div>
          <div className="field">
            <label htmlFor="sell-name">Nombre y apellido</label>
            <input id="sell-name" name="name" className="input" required />
          </div>
          <div className="field">
            <label htmlFor="sell-dni">DNI</label>
            <input id="sell-dni" name="dni" className="input" inputMode="numeric" required />
          </div>
          <div className="field">
            <label htmlFor="sell-phone">Teléfono / WhatsApp</label>
            <input id="sell-phone" name="phone" type="tel" className="input" required />
          </div>
          <div className="field">
            <label htmlFor="sell-email">Email (opcional)</label>
            <input id="sell-email" name="email" type="email" className="input" />
          </div>
          <button className="btn btn-gold btn-block" type="submit">
            Registrar venta
          </button>
        </form>

        <form method="post" action="/api/admin/held" className="held-box">
          <input type="hidden" name="action" value="release" />
          <h3>Liberar (volver a la venta online)</h3>
          <div className="field">
            <label htmlFor="release-codes">Cartones a liberar</label>
            <input id="release-codes" name="codes" className="input" placeholder="Ej: A-0012, A-0345" />
          </div>
          <button className="btn btn-ghost btn-block" type="submit">
            Liberar estos
          </button>
          <button className="btn btn-ghost btn-block" type="submit" name="all" value="1" style={{ marginTop: 8 }}>
            Liberar todos los apartados
          </button>
        </form>
      </div>

      {codes.length > 0 && (
        <details className="held-list">
          <summary>Ver los {codes.length} cartones apartados</summary>
          <p className="codes-cell">{codes.join(", ")}</p>
          <a className="btn btn-sm btn-ghost" href="/api/admin/export?tipo=apartados">
            ⬇ Descargar lista (Excel)
          </a>
        </details>
      )}
    </div>
  );
}

function whatsappLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("54")) digits = `549${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function PendingTransfers({ list }: { list: Pending[] }) {
  return (
    <div className="panel" style={{ marginBottom: 24, borderColor: "var(--gold-500)" }}>
      <h2>Transferencias por confirmar ({list.length})</h2>
      <p className="muted" style={{ marginTop: -6 }}>
        Fijate en tu banco que haya llegado el monto y tocá <b>Confirmar pago</b>: el comprador ya puede descargar sus
        cartones. Si no pagó, tocá <b>Cancelar</b> y los cartones vuelven a estar disponibles.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reservado</th>
              <th>Comprador</th>
              <th>Cartones</th>
              <th>Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>{fecha(o.created_at)}</td>
                <td>
                  {o.buyer_name}
                  <br />
                  <span className="muted">DNI {o.buyer_dni} · </span>
                  <a href={whatsappLink(o.buyer_phone, `Hola ${o.buyer_name.split(" ")[0]}! Te escribo por tu reserva de cartones ${o.ticket_codes.join(", ")}.`)} target="_blank" rel="noreferrer">
                    {o.buyer_phone}
                  </a>
                </td>
                <td className="codes-cell">{o.ticket_codes.join(", ")}</td>
                <td>
                  <strong>{money(o.total)}</strong>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <form method="post" action={`/api/admin/orders/${o.id}`}>
                      <input type="hidden" name="action" value="confirm" />
                      <button className="btn btn-sm btn-incart" type="submit">
                        ✓ Confirmar pago
                      </button>
                    </form>
                    <form method="post" action={`/api/admin/orders/${o.id}`}>
                      <input type="hidden" name="action" value="cancel" />
                      <button className="btn btn-sm btn-ghost" type="submit">
                        Cancelar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SetupPanel() {
  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      <h2>Último paso: preparar la web</h2>
      <p className="muted">
        Este botón prepara la base de datos y crea los 6.000 cartones (A-0001 a A-6000), todos distintos. Se hace una
        sola vez y tarda menos de un minuto. Si algo falla, podés tocarlo de nuevo sin problema.
      </p>
      <form method="post" action="/api/admin/init">
        <button className="btn btn-gold" type="submit">
          Preparar la web
        </button>
      </form>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <div className="container">
        <div className="kicker">Panel privado</div>
        <h1 className="page-title">Administración del sorteo</h1>
        {children}
      </div>
    </div>
  );
}
