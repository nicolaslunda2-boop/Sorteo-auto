"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Foto = { src: string; alt: string };

/** Galería de fotos del premio: se desliza con el dedo; flechas y miniaturas si hay varias. */
export function Gallery({ fotos, caption }: { fotos: Foto[]; caption: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  if (fotos.length === 0) return null;

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const n = (i + fotos.length) % fotos.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
    setIndex(n);
  }

  return (
    <div className="gallery">
      <div className="gallery-frame">
        <div
          className="gallery-track"
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {fotos.map((f, i) => (
            <div className="gallery-slide" key={f.src}>
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="(max-width: 1180px) 100vw, 1150px"
                priority={i === 0}
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
        <div className="gallery-caption">
          <span className="kicker">Premio mayor</span>
          <strong>{caption}</strong>
        </div>
        {fotos.length > 1 && (
          <>
            <button className="gallery-arrow prev" type="button" aria-label="Foto anterior" onClick={() => go(index - 1)}>
              ‹
            </button>
            <button className="gallery-arrow next" type="button" aria-label="Foto siguiente" onClick={() => go(index + 1)}>
              ›
            </button>
            <div className="gallery-count">
              {index + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>
      {fotos.length > 1 && (
        <div className="gallery-thumbs">
          {fotos.map((f, i) => (
            <button
              key={f.src}
              type="button"
              className={`gallery-thumb ${i === index ? "active" : ""}`}
              onClick={() => go(i)}
              aria-label={`Ver foto ${i + 1}`}
            >
              <Image src={f.src} alt="" fill sizes="96px" style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
