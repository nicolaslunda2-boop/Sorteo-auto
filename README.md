# Sorteo Auto — venta de cartones de bingo

Web para vender 6.000 cartones de bingo español (A-0001 a A-6000) para el sorteo de un auto.

👉 **Para ponerla online, seguí la [Guía paso a paso](GUIA.md).**

## Qué incluye

- **6.000 cartones reales de bingo español**: 3 filas x 9 columnas (1-9, 10-19 … 80-90),
  15 números (5 por fila), 12 casilleros vacíos, ninguno repetido.
- **Tres formas de elegir**: lista paginada, búsqueda por número de cartón y
  búsqueda por números favoritos (cartones disponibles con más coincidencias).
- **Reserva de 15 minutos** al elegir un cartón, atómica en la base de datos: dos
  personas nunca pueden quedarse con el mismo cartón.
- **Precios**: $6.500 individual, combo de 3 por $15.000, calculado automáticamente.
- **Mercado Pago Checkout Pro** con confirmación automática por webhook (con
  verificación de firma) y verificación de respaldo al volver del pago.
- **Cartón descargable**: al pagar, el comprador ve sus cartones y los descarga como
  imagen (o los comparte por WhatsApp). También quedan en **Mis cartones**.
- **Panel `/admin`** con contraseña: recaudación, vendidos, disponibles, reservados,
  lista de compras, exportación a Excel (CSV) y botón **Preparar la web** que crea las
  tablas y los cartones.

## Técnico

- Next.js (App Router) + TypeScript, desplegado en Vercel.
- Supabase (Postgres), conectado desde el Marketplace de Vercel: esquema y funciones en
  [`supabase/schema.sql`](supabase/schema.sql), que el panel ejecuta solo vía `POSTGRES_URL`.
  Todo el acceso es desde el servidor con la clave secreta; RLS activado sin políticas públicas.
- Reservas vencidas: se tratan como disponibles en todas las consultas y además una
  tarea `pg_cron` las limpia cada minuto.
- Textos, premios y precios: [`src/lib/config.ts`](src/lib/config.ts).

```bash
cp .env.example .env.local   # completar variables
npm install
npm run dev                  # http://localhost:3000
npm test                     # valida los 6.000 cartones y los precios
```
