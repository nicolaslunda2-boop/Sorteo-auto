import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

export function validSession(s: unknown): s is string {
  return typeof s === "string" && /^[A-Za-z0-9-]{16,64}$/.test(s);
}
