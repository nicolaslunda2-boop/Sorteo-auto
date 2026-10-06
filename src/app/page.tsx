import Link from "next/link";
import { TicketBrowser } from "@/components/TicketBrowser";
import { PREMIOS, PRECIOS, SORTEO, TOTAL_TICKETS, TRANSFERENCIA_HORAS } from "@/lib/config";
import { paymentOptions } from "@/lib/payments";
import { money } from "@/lib/pricing";
import { db, isConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getCounts(): Promise<{ total: number; sold: number } | null> {
  if (!isConfigured()) return null;
  const { data, error } = await db().rpc("raffle_stats");
  if (error || !data) return null;
  return { total: data.total || TOTAL_TICKETS, sold: data.sold };
}

const PASOS = [
  { n: "I", t: "Elegí tu cartón", d: "Mirá la lista, buscá un número puntual o dejá que encontremos cartones con tus números favoritos." },
  { n: "II", t: "Lo reservamos", d: "Al elegirlo queda reservado a tu nombre por 15 minutos: nadie más puede comprarlo." },
  { n: "III", t: "Pagás", d: "" },
  { n: "IV", t: "¡Ya participás!", d: "Apenas se acredita el pago, el cartón es tuyo y lo descargás como imagen en tu celular." },
];

export default async function Home() {
  const counts = await getCounts();
  const pay = paymentOptions();
  const medio =
    pay.transfer && pay.mercadopago
      ? "por transferencia bancaria o con Mercado Pago"
      : pay.mercadopago
        ? "con Mercado Pago: tarjeta, débito o dinero en cuenta"
        : "por transferencia desde tu banco o billetera virtual";
  const pasos = PASOS.map((p) => (p.n === "III" ? { ...p, d: `Completás tus datos y pagás ${medio}.` } : p));
  const sold = counts?.sold ?? 0;
  const total = counts?.total ?? TOTAL_TICKETS;
  const pct = Math.min(100, (sold / total) * 100);
  const comboAhorro = PRECIOS.individual * PRECIOS.comboCantidad - PRECIOS.comboPrecio;

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="certificate">
            <div className="certificate-inner">
              <span className="corner tl" />
              <span className="corner tr" />
              <span className="corner bl" />
              <span className="corner br" />

              <div>
                <div className="kicker">
                  Billete oficial · Serie {SORTEO.serie} · {TOTAL_TICKETS.toLocaleString("es-AR")} cartones
                </div>
                <h1 className="hero-title">{SORTEO.titulo}</h1>
                <p className="hero-sub">{SORTEO.subtitulo}</p>
                <p className="hero-lead">
                  Cada cartón es un bingo único de 15 números. Con uno solo participás por los tres premios.
                  Sorteo: {SORTEO.fecha}.
                </p>
                <div className="price-tags">
                  <div className="price-tag">
                    <small>Cartón individual</small>
                    <strong>{money(PRECIOS.individual)}</strong>
                  </div>
                  <div className="price-tag featured">
                    <small>Combo {PRECIOS.comboCantidad} cartones</small>
                    <strong>{money(PRECIOS.comboPrecio)}</strong>
                    <div className="save">Ahorrás {money(comboAhorro)}</div>
                  </div>
                </div>
                <div className="hero-actions">
                  <Link href="#cartones" className="btn btn-gold">
                    Elegir mi cartón
                  </Link>
                  <Link href="#como-funciona" className="btn btn-ghost">
                    Cómo funciona
                  </Link>
                </div>
              </div>

              <div className="prizes" id="premios">
                <div className="prizes-head">
                  <span className="kicker">Tabla de premios</span>
                  <Seal />
                </div>
                {PREMIOS.map((p, i) => (
                  <div key={p.nombre} className={`prize ${i === PREMIOS.length - 1 ? "grand" : ""}`}>
                    <div className="prize-num">{i + 1}º</div>
                    <div>
                      <div className="prize-name">{p.nombre}</div>
                      <div className="prize-detail">{p.detalle}</div>
                    </div>
                    <div className="prize-amount">{p.premio}</div>
                  </div>
                ))}
                {counts && (
                  <div className="progress-wrap">
                    <div className="progress-labels">
                      <span>
                        Vendidos <strong>{sold.toLocaleString("es-AR")}</strong>
                      </span>
                      <span>
                        Quedan <strong>{(total - sold).toLocaleString("es-AR")}</strong>
                      </span>
                    </div>
                    <div className="progress" aria-label={`${pct.toFixed(0)}% vendido`}>
                      <span style={{ width: `${Math.max(pct, 1)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="cartones">
        <div className="container">
          <div className="section-head">
            <div className="rule kicker">Cartones</div>
            <h2>Elegí tu cartón de la suerte</h2>
            <p>
              Del A-0001 al A-{String(TOTAL_TICKETS).padStart(4, "0")}. Cada uno con 15 números en 3 filas, ninguno se repite.
            </p>
          </div>
          {isConfigured() ? (
            <TicketBrowser />
          ) : (
            <div className="notice setup-warning">
              <strong>La web todavía no está conectada a la base de datos.</strong>
              <br />
              Seguí la guía (archivo GUIA.md): en Vercel, Storage → Supabase.
            </div>
          )}
        </div>
      </section>

      <section className="section" id="como-funciona">
        <div className="container">
          <div className="section-head">
            <div className="rule kicker">Paso a paso</div>
            <h2>Cómo funciona</h2>
          </div>
          <div className="steps">
            {pasos.map((p) => (
              <div className="step" key={p.n}>
                <div className="step-num">{p.n}</div>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="rule kicker">Preguntas frecuentes</div>
            <h2>Antes de comprar</h2>
          </div>
          <div className="faq">
            <details>
              <summary>¿Cómo se gana?</summary>
              <p>
                Se sortean bolillas del 1 al 90. Gana {PREMIOS[0].premio} quien primero complete una fila de su cartón (1ra
                línea), {PREMIOS[1].premio} la 2da línea, y el auto quien primero complete los 15 números (cartón lleno).
              </p>
            </details>
            <details>
              <summary>¿Cuánto cuesta y cómo funciona el combo?</summary>
              <p>
                Cada cartón cuesta {money(PRECIOS.individual)}. Por cada {PRECIOS.comboCantidad} cartones pagás{" "}
                {money(PRECIOS.comboPrecio)}. El descuento se calcula solo en tu compra: por ejemplo, 4 cartones ={" "}
                {money(PRECIOS.comboPrecio + PRECIOS.individual)}.
              </p>
            </details>
            <details>
              <summary>¿Qué pasa si no termino de pagar?</summary>
              <p>
                Al elegir un cartón queda reservado 15 minutos mientras completás tus datos.
                {pay.transfer &&
                  ` Si pagás por transferencia, queda apartado hasta ${TRANSFERENCIA_HORAS} horas mientras confirmamos el pago.`}{" "}
                Si el pago no se completa, el cartón vuelve a estar disponible para otras personas.
              </p>
            </details>
            <details>
              <summary>¿Cómo sé que mi cartón quedó comprado?</summary>
              <p>
                {pay.transfer
                  ? "Cuando confirmamos tu transferencia, en la página de tu compra aparecen tus cartones con un botón para descargarlos como imagen."
                  : "Al terminar el pago vas a ver tus cartones y un botón para descargarlos como imagen en tu celular."}{" "}
                Podés volver a verlos cuando quieras en{" "}
                <a href="/mis-cartones">Mis cartones</a>.
              </p>
            </details>
            <details>
              <summary>¿Dónde se hace el sorteo?</summary>
              <p>
                Se sortea {SORTEO.fecha}. {SORTEO.lugar}.
              </p>
            </details>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <span>
            © {new Date().getFullYear()} {SORTEO.organizador}
          </span>
          <span>{SORTEO.contacto}</span>
          <span>{pay.transfer ? "Pago por transferencia bancaria" : "Pagos procesados por Mercado Pago"}</span>
        </div>
      </footer>
    </>
  );
}

function Seal() {
  return (
    <svg className="seal" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id="seal-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="#0a1430" stroke="#c9a44c" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="#7a5f27" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="60" cy="60" r="32" fill="none" stroke="#c9a44c" strokeWidth="1" />
      <text>
        <textPath href="#seal-circle">SORTEO OFICIAL · FIAT CRONOS · MODELO 2023 ·</textPath>
      </text>
      <text x="60" y="58" textAnchor="middle" style={{ font: "700 15px var(--font-serif)", fontVariantNumeric: "lining-nums", letterSpacing: 0, fill: "#f1dc9f" }}>
        2023
      </text>
      <text x="60" y="73" textAnchor="middle" style={{ font: "700 7px var(--font-sans)", letterSpacing: 1.5, fill: "#c9a44c" }}>
        SERIE {SORTEO.serie}
      </text>
    </svg>
  );
}
