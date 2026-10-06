import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "sorteo_admin";

export function adminToken(): string | null {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return null;
  return crypto.createHmac("sha256", pass).update("sorteo-admin-v1").digest("hex");
}

export function checkPassword(input: string): boolean {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return false;
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(pass).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const expected = adminToken();
  if (!expected) return false;
  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  if (!value || value.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
