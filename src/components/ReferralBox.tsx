"use client";

import { useEffect, useState } from "react";
import { PREMIO_REFERIDOS, SORTEO } from "@/lib/config";

/** Link personal para invitar amigos y participar del sorteo de referidos. */
export function ReferralBox({ code, friends }: { code: string; friends: number }) {
  const [link, setLink] = useState(`/?ref=${code}`);
  const [copied, setCopied] = useState(false);
  useEffect(() => setLink(`${window.location.origin}/?ref=${code}`), [code]);

  const message = `¡Participá por un ${SORTEO.auto}! Elegí tu cartón acá 👉 ${link}`;

  return (
    <div className="panel referral">
      <div className="kicker">Invitá y ganá</div>
      <h2>Participá por {PREMIO_REFERIDOS} extra</h2>
      <p className="muted">
        Compartí tu link. Por cada amigo que compre su cartón con tu link sumás <b>1 chance</b> en el sorteo de{" "}
        {PREMIO_REFERIDOS} entre quienes invitan. Cuantos más amigos, más chances.
      </p>
      <div className="referral-link">
        <span className="mono">{link.replace(/^https?:\/\//, "")}</span>
        <button
          className="btn btn-sm btn-ghost"
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* el navegador no permite copiar */
            }
          }}
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
      <a
        className="btn btn-whatsapp btn-block"
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noreferrer"
      >
        Compartir por WhatsApp
      </a>
      <p className="referral-count">
        {friends === 0
          ? "Todavía ningún amigo compró con tu link."
          : `Ya ${friends === 1 ? "compró 1 amigo" : `compraron ${friends} amigos`} con tu link: tenés ${friends} ${friends === 1 ? "chance" : "chances"}.`}
      </p>
    </div>
  );
}
