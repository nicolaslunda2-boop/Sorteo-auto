import { SORTEO, TOTAL_TICKETS } from "./config.ts";

export type TicketStatus = "available" | "reserved" | "sold";

export type Ticket = {
  id: number;
  code: string;
  grid: number[];
  status: TicketStatus;
  matches?: number;
};

export function ticketCode(id: number): string {
  return `${SORTEO.serie}-${String(id).padStart(4, "0")}`;
}

/** Acepta "A-0123", "a0123", "123", "0123" y devuelve el número (o null). */
export function parseTicketQuery(q: string): number | null {
  const digits = q.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return n >= 1 && n <= TOTAL_TICKETS ? n : null;
}
