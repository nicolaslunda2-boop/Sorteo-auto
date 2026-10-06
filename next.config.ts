import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // El botón "Preparar la web" del panel lee este archivo para crear las tablas.
  outputFileTracingIncludes: {
    "/api/admin/init": ["./supabase/schema.sql"],
  },
};

export default nextConfig;
