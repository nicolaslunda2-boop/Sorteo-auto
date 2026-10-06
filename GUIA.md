# Guía para poner tu web online (versión corta)

Son **4 pasos**, unos **30 minutos** en total. No hace falta instalar nada: todo se hace
desde el navegador (se puede desde el celular, pero es más cómodo en computadora).

| Paso | Qué hacés | Tiempo |
|---|---|---|
| 1 | Mercado Pago: crear la "aplicación" y copiar 1 clave | 10 min |
| 2 | Vercel: publicar la web | 5 min |
| 3 | Vercel: crear la base de datos con unos clics | 5 min |
| 4 | Entrar a tu panel y tocar **"Preparar la web"** | 1 min |
| ✔ | Hacer una compra de prueba y pasar a cobros reales | 10 min |

> ⚠️ Las claves son como las llaves de tu casa: no las mandes por WhatsApp ni las
> publiques. Solo se pegan en Vercel.

---

## Paso 1 — Mercado Pago (para cobrar)

Usá tu cuenta de Mercado Pago normal: es donde vas a recibir la plata.

1. Entrá a <https://www.mercadopago.com.ar/developers> e iniciá sesión.
2. Arriba a la derecha: **Tus integraciones** → **Crear aplicación**.
3. Completá:
   - **Nombre:** `Sorteo Auto`
   - **Tipo de solución:** **Pagos online**
   - **¿Usás una plataforma de e-commerce?** **No**
   - **Producto:** **Checkout Pro**
4. Aceptá y tocá **Crear aplicación**.
5. Menú de la izquierda → **Credenciales de prueba** → copiá el **Access Token**
   y guardalo en una nota. Lo vas a pegar en el paso 2.
6. Menú de la izquierda → **Cuentas de prueba** → **Crear cuenta de prueba**:
   descripción `Comprador`, país **Argentina**, saldo `50000`.
   Guardá el **usuario** y la **contraseña** que te muestra (es un comprador "de mentira"
   para probar sin plata real).

---

## Paso 2 — Vercel (publicar la web)

1. Entrá a <https://vercel.com/signup>, elegí **Hobby** (gratis) y **Continue with GitHub**.
2. **Add New…** → **Project** → al lado de `Sorteo-auto` tocá **Import**.
   (Si no aparece: **Adjust GitHub App Permissions** y dale acceso a ese repositorio.)
3. Abrí **Environment Variables** y cargá estas dos (nombre a la izquierda, valor a la
   derecha, botón **Add**):

   | Nombre | Valor |
   |---|---|
   | `MP_ACCESS_TOKEN` | el Access Token de prueba del paso 1 |
   | `ADMIN_PASSWORD` | una contraseña que inventes para tu panel (ej: `Cronos-Sorteo-2026!`) |

4. Tocá **Deploy** y esperá 1–2 minutos. Vas a ver tu dirección, del tipo
   **`https://sorteo-auto-xxxx.vercel.app`**.

La web ya está online, pero todavía sin cartones: le falta la base de datos.

---

## Paso 3 — Base de datos (desde Vercel)

1. Dentro de tu proyecto en Vercel, abrí la pestaña **Storage**.
2. **Create Database** (o **Browse Marketplace**) → elegí **Supabase** → **Continue**.
3. Aceptá los términos. Si te pregunta:
   - **Plan:** **Free**
   - **Región:** **São Paulo** (South America), la más cercana
   - **Nombre:** `sorteo-auto`
4. Tocá **Create**. Cuando termine, si te pregunta a qué proyecto conectarla, elegí
   `sorteo-auto` (con todos los entornos marcados) → **Connect**.
5. Pestaña **Deployments** → en el primero de la lista, los tres puntitos **⋯** →
   **Redeploy** → **Redeploy**. Así la web "se entera" de la base de datos nueva.

Vercel crea la cuenta de Supabase y carga las claves solo: no tenés que copiar nada.

---

## Paso 4 — Preparar la web

1. Abrí `https://TU-DIRECCION.vercel.app/admin`.
2. Entrá con la contraseña que pusiste en `ADMIN_PASSWORD`.
3. Tocá **Preparar la web**. En menos de un minuto aparece
   **"¡Listo! Se crearon 6000 cartones"**.

Abrí la página principal: ya se ven los cartones A-0001, A-0002…

---

## ✔ Compra de prueba

1. Abrí tu web en una **ventana de incógnito**.
2. Elegí 3 cartones: el total tiene que dar **$15.000** (combo).
3. **Ir a pagar** → completá datos → **Pagar con Mercado Pago**.
4. En Mercado Pago, iniciá sesión con el **comprador de prueba** del paso 1.
5. Pagá con esta tarjeta de prueba:
   - Número `5031 7557 3453 0604` · Vencimiento `11/30` · Código `123`
   - Titular: **`APRO`** (esa palabra hace que el pago se apruebe) · DNI `12345678`
6. Volvés a la web y aparece **"¡Felicitaciones!"** con los cartones y el botón
   **Descargar**.
7. En `/admin` tenés que ver la compra y $15.000 recaudados.

## ✔ Pasar a cobros reales

1. Mercado Pago Developers → tu aplicación → **Credenciales de producción**
   (puede pedirte rubro y sitio web: poné tu dirección de Vercel). Copiá el **Access Token**.
2. Vercel → **Settings** → **Environment Variables** → `MP_ACCESS_TOKEN` → **⋯** →
   **Edit** → pegá el nuevo → **Save**.
3. **Deployments** → **⋯** → **Redeploy**.
4. Hacé una compra real de 1 cartón (por ejemplo con la cuenta de un familiar) y después
   devolvé ese pago desde tu Mercado Pago si querés.

¡Listo para compartir el link! 🚗

---

## Qué recibe el comprador

Después de pagar ve sus cartones en pantalla, con botones para **descargarlos como
imagen** o **compartirlos por WhatsApp**. Cada imagen tiene su nombre, el número de
cartón y el sello "PAGADO". También puede volver a verlos desde **Mis cartones**.
Mercado Pago, además, le manda el comprobante de pago por email.

## Tu panel `/admin`

- Total recaudado, vendidos, disponibles y reservados en este momento.
- **Descargar lista de compradores (Excel)**: una fila por cartón vendido (cartón,
  nombre, DNI, email, teléfono, fecha). Usala el día del sorteo.
- Compras marcadas **"Revisar"** (en rojo): casos rarísimos en que alguien pagó cuando su
  reserva ya había vencido y otra persona compró el mismo cartón. Contactala para darle
  otro cartón o devolverle el dinero.

## Cambiar textos, fecha o premios

Todo está en [`src/lib/config.ts`](src/lib/config.ts). En GitHub: abrilo → lápiz ✏️ →
cambiá lo que está entre comillas (por ejemplo `fecha: "Fecha a confirmar"`) →
**Commit changes**. Vercel publica el cambio solo en 1–2 minutos.
No cambies `SEMILLA_CARTONES` ni `TOTAL_TICKETS` después de crear los cartones.

---

## Si algo no funciona

| Problema | Solución |
|---|---|
| La web dice "todavía no está conectada a la base de datos" | Hiciste el paso 3 pero falta el **Redeploy** del final. |
| "Preparar la web" muestra un error | Tocalo de nuevo. Si sigue, mandame una captura del mensaje. |
| "No pudimos conectar con Mercado Pago" | Revisá `MP_ACCESS_TOKEN` (sin espacios) y hacé **Redeploy**. |
| Pagué pero el cartón no figura vendido | Esperá un minuto y recargá. Mercado Pago avisa solo a la web; si no llega, la web lo verifica cuando el comprador vuelve. |
| En Vercel no aparece Supabase en Storage | Usá el **Plan B** de abajo. |

### Plan B: crear Supabase por tu cuenta

Solo si el paso 3 no te funciona:

1. Entrá a <https://supabase.com> → **Start your project** → **Continue with GitHub** →
   **New project** (región São Paulo, generá y guardá la contraseña).
2. **SQL Editor** → **New query** → pegá el contenido del archivo
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. **Project Settings** → **API Keys**: copiá la clave secreta (`sb_secret_…` o
   `service_role`). Y en **Data API** copiá la **Project URL**.
4. En Vercel cargá `SUPABASE_URL` (la URL) y `SUPABASE_SERVICE_ROLE_KEY` (la clave),
   hacé **Redeploy** y seguí con el paso 4.

### Opcional: más seguridad en los avisos de pago

En Mercado Pago → tu aplicación → **Webhooks** → **Configurar notificaciones**, poné la URL
`https://TU-DIRECCION.vercel.app/api/webhooks/mercadopago`, evento **Pagos**, guardá, y
copiá la **clave secreta** a Vercel como `MP_WEBHOOK_SECRET` (+ Redeploy). No es
obligatorio: la web siempre confirma cada pago consultándolo directamente a Mercado Pago.

---

## Importante: lo legal

En Argentina, las rifas y sorteos con venta de números suelen requerir **autorización de
la lotería provincial**, y los premios pagan impuestos. Antes de vender, consultá con un
contador o con la lotería de tu provincia.

La web vende los cartones; el sorteo de las bolillas (1 al 90) lo hacés vos en vivo,
usando la lista exportada para controlar los cartones ganadores.
