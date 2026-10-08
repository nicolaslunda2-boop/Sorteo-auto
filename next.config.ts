import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // La web lee este archivo para crear o actualizar la base de datos sola.
  outputFileTracingIncludes: {
    "/**": ["./supabase/schema.sql"],
  },
};

export default nextConfig;
