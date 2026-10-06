"use client";

import { useState } from "react";
import { useCountdown } from "./CartProvider";
import { money } from "@/lib/pricing";

type Transfer = { alias: string; cbu: string | null; titular: string | null; banco: string | null; whatsapp: string | null };

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="bank-row">
      <div>
        <small>{label}</small>
        <span className={mono ? "mono" : ""}>{value}</span>
      </div>
      <button
        className="btn btn-sm btn-ghost"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setOk(true);
            setTimeout(() => setOk(false), 2000);
          } catch {
            /* el navegador no permite copiar */
          }
        }}
      >
        {ok ? "✓ Copiado" : "Copiar"}
      </button>
    </div>
  );
}

export function TransferInstructions(props: {
  transfer: Transfer | null;
  total: number;
  codes: string[];
  name: string;
  expiresAt: string | null;
}) {
  const { transfer, total, codes, name, expiresAt } = props;
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const { seconds } = useCountdown(target);
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  const message = `Hola! Te envío el comprobante de transferencia por ${money(total)} de los cartones ${codes.join(", ")}. A nombre de ${name}.`;
  const waLink = transfer?.whatsapp ? `https://wa.me/${transfer.whatsapp}?text=${encodeURIComponent(message)}` : null;

  return (
    <div className="result">
      <div className="result-icon wait">$</div>
      <div className="kicker">Cartones apartados</div>
      <h1 className="page-title">Último paso: transferí</h1>
      <p className="muted">
        Tus cartones <strong style={{ color: "var(--gold-300)" }}>{codes.join(", ")}</strong> quedan apartados a tu nombre
        {target && seconds > 0 ? ` por ${hours > 0 ? `${hours} h ` : ""}${mins} min más` : ""}.
      </p>

      {transfer ? (
        <div className="panel bank">
          <div className="bank-amount">
            <small>Monto exacto a transferir</small>
            <strong>{money(total)}</strong>
          </div>
          {transfer.alias && <CopyRow label="Alias" value={transfer.alias} mono />}
          {transfer.cbu && <CopyRow label="CBU / CVU" value={transfer.cbu} mono />}
          {transfer.titular && (
            <div className="bank-row">
              <div>
                <small>Titular</small>
                <span>{transfer.titular}</span>
              </div>
            </div>
          )}
          {transfer.banco && (
            <div className="bank-row">
              <div>
                <small>Banco / billetera</small>
                <span>{transfer.banco}</span>
              </div>
            </div>
          )}
          <ol className="bank-steps">
            <li>Transferí el monto exacto desde tu banco o billetera virtual.</li>
            <li>{waLink ? "Mandanos el comprobante por WhatsApp con el botón de abajo." : "Guardá el comprobante."}</li>
            <li>Cuando confirmemos el pago, en esta misma página vas a poder descargar tus cartones.</li>
          </ol>
          {waLink && (
            <a className="btn btn-whatsapp btn-block" href={waLink} target="_blank" rel="noreferrer" style={{ marginTop: 10 }}>
              Enviar comprobante por WhatsApp
            </a>
          )}
        </div>
      ) : (
        <div className="notice">Contactate con la organización para recibir los datos de pago.</div>
      )}

      <p className="muted" style={{ fontSize: ".9rem" }}>
        Guardá el enlace de esta página: se actualiza sola cuando el pago queda confirmado.
      </p>
    </div>
  );
}
