import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import { db, isConfigured } from "@/lib/supabase";
import { money } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración", robots: { index: false } };

type Stats = { total: number; sold: number; reserved: number; revenue: number; orders: number; conflicts: number };
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

  const showAll = params.ver === "todos";
  const [{ data: stats, error: statsError }, { data: orders }] = await Promise.all([
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
  const available = s.total - s.sold - s.reserved;

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
          <small>Disponibles</small>
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
          vendido a otra persona mientras pagaba. Contactala para asignarle otro cartón o devolverle el dinero desde Mercado
          Pago.
        </div>
      )}

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
                <th>Pago MP</th>
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
    </Shell>
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
