// Dibuja cartones como imagen PNG en el navegador (para descargar o compartir).
import { SORTEO } from "./config.ts";

export type TicketForImage = { code: string; grid: number[] };

const W = 1000;
const PAD = 44;
const CELL = (W - PAD * 2) / 9;
const HEADER = 150;
const FOOTER = 110;
const CARD_H = PAD + HEADER + CELL * 3 + FOOTER + 20;
const GAP = 40;

const C = {
  paper: "#f7f0dd",
  paper2: "#efe4c7",
  ink: "#13224d",
  gold: "#a7843a",
  goldDark: "#7a5f27",
  red: "#a3271f",
  green: "#2f7d5b",
  page: "#0a1430",
};

function fonts() {
  const css = getComputedStyle(document.documentElement);
  return {
    serif: css.getPropertyValue("--font-serif").trim() || "Georgia, serif",
    sans: css.getPropertyValue("--font-sans").trim() || "system-ui, sans-serif",
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function spaced(ctx: CanvasRenderingContext2D, px: number) {
  // letterSpacing existe en Chrome/Edge/Safari recientes; si no, se ignora.
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
}

function drawTicket(ctx: CanvasRenderingContext2D, top: number, t: TicketForImage, holder: string) {
  const f = fonts();

  // Papel
  const g = ctx.createLinearGradient(0, top, 0, top + CARD_H);
  g.addColorStop(0, C.paper);
  g.addColorStop(1, C.paper2);
  roundRect(ctx, 0, top, W, CARD_H, 22);
  ctx.fillStyle = g;
  ctx.fill();

  // Filetes dorados
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3;
  roundRect(ctx, 14, top + 14, W - 28, CARD_H - 28, 14);
  ctx.stroke();
  ctx.lineWidth = 1;
  roundRect(ctx, 24, top + 24, W - 48, CARD_H - 48, 10);
  ctx.stroke();

  // Encabezado
  let y = top + PAD + 26;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = C.goldDark;
  ctx.font = `800 17px ${f.sans}`;
  spaced(ctx, 4);
  ctx.fillText(`CARTÓN OFICIAL · SERIE ${SORTEO.serie}`, PAD, y);
  spaced(ctx, 0);
  ctx.fillStyle = C.ink;
  ctx.font = `700 40px ${f.serif}`;
  ctx.fillText(SORTEO.titulo, PAD, y + 48);
  ctx.font = `600 19px ${f.sans}`;
  ctx.fillStyle = C.goldDark;
  ctx.fillText(`Premio mayor: ${SORTEO.auto}`, PAD, y + 82);

  ctx.textAlign = "right";
  ctx.font = `700 17px ${f.sans}`;
  spaced(ctx, 3);
  ctx.fillText("Nº", W - PAD, y);
  spaced(ctx, 1);
  ctx.fillStyle = C.red;
  // Sans para que el 0 no se confunda con una "o" (Playfair usa números antiguos).
  ctx.font = `800 58px ${f.sans}`;
  ctx.fillText(t.code, W - PAD, y + 60);
  spaced(ctx, 0);

  // Línea perforada con muescas
  const perfY = top + PAD + HEADER - 18;
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = "rgba(122,95,39,.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, perfY);
  ctx.lineTo(W - 14, perfY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.page;
  for (const cx of [0, W]) {
    ctx.beginPath();
    ctx.arc(cx, perfY, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grilla de bingo
  const gy = top + PAD + HEADER;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < 27; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const x = PAD + c * CELL;
    const yy = gy + r * CELL;
    const n = t.grid[i];
    if (n === 0) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, yy, CELL, CELL);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, yy, CELL, CELL);
      ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,.07)";
      ctx.lineWidth = 2;
      for (let d = -CELL; d < CELL * 2; d += 9) {
        ctx.beginPath();
        ctx.moveTo(x + d, yy);
        ctx.lineTo(x + d - CELL, yy + CELL);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.fillRect(x, yy, CELL, CELL);
      ctx.fillStyle = C.ink;
      ctx.font = `700 46px ${f.serif}`;
      ctx.fillText(String(n), x + CELL / 2, yy + CELL / 2 + 2);
    }
  }
  ctx.strokeStyle = "rgba(19,34,77,.4)";
  ctx.lineWidth = 1.5;
  for (let c = 1; c < 9; c++) {
    ctx.beginPath();
    ctx.moveTo(PAD + c * CELL, gy);
    ctx.lineTo(PAD + c * CELL, gy + CELL * 3);
    ctx.stroke();
  }
  for (let r = 1; r < 3; r++) {
    ctx.beginPath();
    ctx.moveTo(PAD, gy + r * CELL);
    ctx.lineTo(W - PAD, gy + r * CELL);
    ctx.stroke();
  }
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(PAD, gy, CELL * 9, CELL * 3);

  // Pie
  const fy = gy + CELL * 3 + 50;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = C.goldDark;
  ctx.font = `800 15px ${f.sans}`;
  spaced(ctx, 3);
  ctx.fillText("TITULAR", PAD, fy - 22);
  spaced(ctx, 0);
  ctx.fillStyle = C.ink;
  ctx.font = `700 28px ${f.serif}`;
  ctx.fillText(holder, PAD, fy + 12);
  ctx.font = `500 17px ${f.sans}`;
  ctx.fillStyle = C.goldDark;
  ctx.fillText(`Sorteo: ${SORTEO.fecha}`, PAD, fy + 42, W - PAD * 2 - 240);

  // Sello "PAGADO"
  ctx.save();
  ctx.translate(W - PAD - 110, fy + 6);
  ctx.rotate(-0.12);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  roundRect(ctx, -100, -32, 200, 64, 10);
  ctx.stroke();
  roundRect(ctx, -94, -26, 188, 52, 7);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = C.green;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 30px ${f.serif}`;
  spaced(ctx, 5);
  ctx.fillText("PAGADO", 0, 2);
  spaced(ctx, 0);
  ctx.restore();
}

/** Devuelve un PNG con uno o varios cartones, uno debajo del otro. */
export async function ticketsToPng(tickets: TicketForImage[], holder: string): Promise<Blob> {
  const f = fonts();
  try {
    await Promise.all([
      document.fonts.load(`700 40px ${f.serif}`),
      document.fonts.load(`800 40px ${f.serif}`),
      document.fonts.load(`700 20px ${f.sans}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* si las fuentes no cargan, se usan las del sistema */
  }

  const margin = 30;
  const canvas = document.createElement("canvas");
  canvas.width = W + margin * 2;
  canvas.height = tickets.length * CARD_H + (tickets.length - 1) * GAP + margin * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = C.page;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(margin, margin);
  tickets.forEach((t, i) => drawTicket(ctx, i * (CARD_H + GAP), t, holder));

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo crear la imagen"))), "image/png"),
  );
}

export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

type ShareNavigator = Navigator & { canShare?: (d: { files: File[] }) => boolean };

/** ¿El celular permite compartir imágenes (WhatsApp, etc.)? */
export function canShareImages(): boolean {
  if (typeof navigator === "undefined" || typeof File === "undefined") return false;
  const nav = navigator as ShareNavigator;
  try {
    return Boolean(nav.canShare?.({ files: [new File([""], "a.png", { type: "image/png" })] }));
  } catch {
    return false;
  }
}

export async function shareImage(blob: Blob, filename: string, text: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });
  try {
    await navigator.share({ files: [file], title: filename, text });
  } catch (e) {
    if ((e as Error).name !== "AbortError") downloadImage(blob, filename);
  }
}
