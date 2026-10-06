import { PRECIOS } from "./config.ts";

export type Breakdown = {
  count: number;
  combos: number;
  singles: number;
  total: number;
  savings: number;
};

/** Combos de 3 al precio promocional; el resto a precio individual. */
export function calcTotal(
  count: number,
  p: { individual: number; comboCantidad: number; comboPrecio: number } = PRECIOS,
): Breakdown {
  const n = Math.max(0, Math.floor(count));
  const combos = Math.floor(n / p.comboCantidad);
  const singles = n % p.comboCantidad;
  const total = combos * p.comboPrecio + singles * p.individual;
  return { count: n, combos, singles, total, savings: n * p.individual - total };
}

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function money(value: number): string {
  return ars.format(value).replace(/\s/g, "");
}
