export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!fromEnv) return "http://localhost:3000";
  const withProtocol = fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
  return withProtocol.replace(/\/+$/, "");
}
