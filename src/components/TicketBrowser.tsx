"use client";

import { useCallback, useEffect, useState } from "react";
import { BingoCard } from "./BingoCard";
import { useCart } from "./CartProvider";
import { PRECIOS } from "@/lib/config";
import { money } from "@/lib/pricing";
import type { Ticket } from "@/lib/tickets";

type Mode = "todos" | "numero" | "favoritos";

const MAX_FAVS = 15;

const MODES: { id: Mode; icon: string; title: string; text: string }[] = [
  { id: "todos", icon: "☰", title: "Ver todos los cartones", text: "Recorré la lista y elegí el que más te guste." },
  { id: "numero", icon: "#", title: "Buscar un Nº de cartón", text: "¿Tenés un número de la suerte? Ej.: A-0777." },
  {
    id: "favoritos",
    icon: "★",
    title: "Buscar con mis números",
    text: "Marcá tus números favoritos y te mostramos los cartones que los tienen.",
  },
];

export function TicketBrowser() {
  const [mode, setMode] = useState<Mode>("todos");

  return (
    <div>
      <p className="modes-intro">¿Cómo querés elegir tu cartón? Tocá una opción:</p>
      <div className="modes" role="tablist" aria-label="Formas de elegir">
        {MODES.map((m) => (
          <button
            key={m.id}
            className="mode"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
          >
            <span className="mode-icon" aria-hidden="true">
              {m.icon}
            </span>
            <span className="mode-text">
              <strong>{m.title}</strong>
              <small>{m.text}</small>
            </span>
          </button>
        ))}
      </div>
      {mode === "todos" && <AllTickets />}
      {mode === "numero" && <SearchByCode />}
      {mode === "favoritos" && <Favorites />}
    </div>
  );
}

function TicketGrid({ tickets, highlight }: { tickets: Ticket[]; highlight?: Set<number> }) {
  const cart = useCart();
  return (
    <div className="ticket-list">
      {tickets.map((t) => {
        const inCart = cart.ids.has(t.id);
        const status = inCart ? "reserved" : t.status;
        return (
          <BingoCard
            key={t.id}
            code={t.code}
            grid={t.grid}
            status={status}
            inCart={inCart}
            highlight={highlight}
            footer={
              <>
                {t.matches != null ? (
                  <span className="ticket-match">
                    {t.matches} {t.matches === 1 ? "coincidencia" : "coincidencias"}
                  </span>
                ) : (
                  <span className="ticket-price">
                    <small>Valor</small>
                    {money(PRECIOS.individual)}
                  </span>
                )}
                {inCart ? (
                  <button
                    className="btn btn-sm btn-incart"
                    disabled={cart.busy === t.id}
                    onClick={() => cart.remove(t.id)}
                    title="Quitar de mi compra"
                  >
                    ✓ En tu compra
                  </button>
                ) : t.status === "available" ? (
                  <button className="btn btn-sm btn-ink" disabled={cart.busy === t.id || !cart.session} onClick={() => cart.add(t.id)}>
                    {cart.busy === t.id ? "Reservando…" : "Elegir este cartón"}
                  </button>
                ) : (
                  <span className="muted" style={{ fontSize: ".85rem", color: "#6b6450" }}>
                    No disponible
                  </span>
                )}
              </>
            }
          />
        );
      })}
    </div>
  );
}

function useTickets(url: string | null, init?: RequestInit) {
  const [data, setData] = useState<{ tickets: Ticket[]; total?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const body = init?.body;

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(url, { cache: "no-store", ...(body ? { method: "POST", body, headers: { "Content-Type": "application/json" } } : {}) })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(json.error ?? "No pudimos cargar los cartones.");
        else setData(json);
      })
      .catch(() => !cancelled && setError("Sin conexión. Revisá tu internet."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [url, body]);

  return { data, error, loading };
}

function AllTickets() {
  const [page, setPage] = useState(1);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const { items } = useCart();
  const { data, error, loading } = useTickets(
    `/api/tickets?page=${page}&filter=${onlyAvailable ? "available" : "all"}&v=${items.length}`,
  );
  const pages = data?.total ? Math.ceil(data.total / 24) : 1;

  const go = useCallback(
    (p: number) => {
      setPage(Math.min(Math.max(1, p), pages));
      document.getElementById("cartones")?.scrollIntoView({ behavior: "smooth" });
    },
    [pages],
  );

  return (
    <div>
      <div className="toolbar">
        <label className="check">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => {
              setOnlyAvailable(e.target.checked);
              setPage(1);
            }}
          />
          Mostrar solo cartones disponibles
        </label>
        {data && (
          <span className="pager-info">
            {data.total?.toLocaleString("es-AR")} cartones {onlyAvailable ? "disponibles" : "en total"}
          </span>
        )}
      </div>
      {error && <div className="notice notice-error">{error}</div>}
      {!error && !data && loading && <div className="empty">Cargando cartones…</div>}
      {data && data.tickets.length === 0 && <div className="empty">No hay cartones para mostrar.</div>}
      {data && data.tickets.length > 0 && (
        <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>
          <TicketGrid tickets={data.tickets} />
        </div>
      )}
      {data && pages > 1 && (
        <div className="pager">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => go(page - 1)}>
            ← Anterior
          </button>
          <span className="pager-info">
            Página <strong>{page}</strong> de <strong>{pages}</strong>
          </span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => go(page + 1)}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

function SearchByCode() {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const { items } = useCart();
  const { data, error, loading } = useTickets(query ? `/api/tickets?q=${encodeURIComponent(query)}&v=${items.length}` : null);

  return (
    <div>
      <form
        className="search-box"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) setQuery(value.trim());
        }}
      >
        <input
          className="input input-serial"
          placeholder="Ej: A-0777 o 777"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          aria-label="Número de cartón"
        />
        <button className="btn btn-gold" type="submit">
          Buscar
        </button>
      </form>
      {error && <div className="notice notice-error">{error}</div>}
      {loading && <div className="empty">Buscando…</div>}
      {!loading && data && data.tickets.length === 0 && (
        <div className="empty">No existe ese número de cartón. Los cartones van del A-0001 al A-6000.</div>
      )}
      {!loading && data && data.tickets.length > 0 && (
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <TicketGrid tickets={data.tickets} />
        </div>
      )}
      {!query && <p className="muted" style={{ textAlign: "center" }}>Escribí el número del cartón que buscás, por ejemplo <b>777</b> o <b>A-0777</b> (es lo mismo), y tocá Buscar.</p>}
    </div>
  );
}

function Favorites() {
  const [selected, setSelected] = useState<number[]>([]);
  const [body, setBody] = useState<string | null>(null);
  const { data, error, loading } = useTickets(body ? "/api/tickets/favoritos" : null, body ? { body } : undefined);
  const set = new Set(selected);

  function toggle(n: number) {
    setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : s.length < MAX_FAVS ? [...s, n].sort((a, b) => a - b) : s));
  }

  return (
    <div>
      <div className="fav-panel">
        <div className="kicker">Elegí hasta {MAX_FAVS} números</div>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          Tocá en el tablero los números que te gustan (no hace falta escribir nada). Para quitar uno, volvé a
          tocarlo. Después tocá <b>Buscar cartones</b> y te mostramos los cartones disponibles con más números en
          común, marcados en dorado.
        </p>
        <div className="fav-grid">
          {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className="fav-num"
              aria-pressed={set.has(n)}
              disabled={!set.has(n) && selected.length >= MAX_FAVS}
              onClick={() => toggle(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="fav-foot">
          <span className="muted">
            {selected.length} de {MAX_FAVS} elegidos
            {selected.length > 0 && (
              <>
                {" · "}
                <button className="btn btn-sm btn-ghost" onClick={() => setSelected([])} style={{ padding: "4px 10px" }}>
                  Borrar
                </button>
              </>
            )}
          </span>
          <button
            className="btn btn-gold"
            disabled={selected.length === 0}
            onClick={() => setBody(JSON.stringify({ numbers: selected, t: Date.now() }))}
          >
            Buscar cartones
          </button>
        </div>
      </div>
      {error && <div className="notice notice-error">{error}</div>}
      {loading && <div className="empty">Buscando coincidencias…</div>}
      {!loading && data && data.tickets.length === 0 && (
        <div className="empty">No encontramos cartones disponibles con esos números. Probá con otros.</div>
      )}
      {!loading && data && data.tickets.length > 0 && <TicketGrid tickets={data.tickets} highlight={new Set(selected)} />}
    </div>
  );
}
