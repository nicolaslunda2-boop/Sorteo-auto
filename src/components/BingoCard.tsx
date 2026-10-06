import { SORTEO } from "@/lib/config";
import type { TicketStatus } from "@/lib/tickets";

type Props = {
  code: string;
  grid: number[];
  status?: TicketStatus;
  highlight?: Set<number>;
  inCart?: boolean;
  mini?: boolean;
  footer?: React.ReactNode;
};

export function BingoCard({ code, grid, status = "available", highlight, inCart, mini, footer }: Props) {
  const unavailable = status !== "available" && !inCart;
  return (
    <article
      className={`ticket ${inCart ? "in-cart" : ""} ${unavailable ? "is-unavailable" : ""} ${mini ? "mini" : ""}`}
      aria-label={`Cartón ${code}`}
    >
      <div className="ticket-frame">
        <div className="ticket-head">
          <div>
            <div className="ticket-kicker">Cartón oficial · Serie {SORTEO.serie}</div>
            <div className="ticket-title">{SORTEO.titulo}</div>
          </div>
          <div className="ticket-serial">
            Nº<b>{code}</b>
          </div>
        </div>
        <div className="perf" aria-hidden="true" />
        <div className="bingo" role="grid">
          {grid.map((n, i) =>
            n === 0 ? (
              <div key={i} className="cell blank" aria-hidden="true" />
            ) : (
              <div key={i} className={`cell ${highlight?.has(n) ? "hit" : ""}`} role="gridcell">
                <span>{n}</span>
              </div>
            ),
          )}
        </div>
        {footer && <div className="ticket-foot">{footer}</div>}
      </div>
      {unavailable && status === "sold" && <div className="stamp sold">Vendido</div>}
      {unavailable && status === "reserved" && <div className="stamp reserved">Reservado</div>}
    </article>
  );
}
