# Guía para poner tu web online (versión corta)

Son **3 pasos**, unos **15 minutos** en total. No hace falta instalar nada: todo se hace
desde el navegador (se puede desde el celular, pero es más cómodo en computadora).

| Paso | Qué hacés | Tiempo |
|---|---|---|
| 1 | Vercel: publicar la web con tus datos bancarios | 5 min |
| 2 | Vercel: crear la base de datos con unos clics | 5 min |
| 3 | Entrar a tu panel y tocar **"Preparar la web"** | 1 min |
| ✔ | Hacer una reserva de prueba | 5 min |

Los compradores pagan **por transferencia** a tu cuenta: la plata te llega al instante y
vos confirmás cada pago desde tu panel.

---

## Paso 1 — Vercel (publicar la web)

1. Entrá a <https://vercel.com/signup>, elegí **Hobby** (gratis) y **Continue with GitHub**.
2. **Add New…** → **Project** → al lado de `Sorteo-auto` tocá **Import**.
   (Si no aparece: **Adjust GitHub App Permissions** y dale acceso a ese repositorio.)
3. Abrí **Environment Variables** y cargá estos datos (nombre a la izquierda, valor a la
   derecha, botón **Add** después de cada uno):

   | Nombre | Valor | Ejemplo |
   |---|---|---|
   | `ADMIN_PASSWORD` | una contraseña que inventes para tu panel | `Cronos-Sorteo-2026!` |
   | `TRANSFER_ALIAS` | el alias de tu cuenta | `mi.alias.mp` |
   | `TRANSFER_CBU` | tu CBU o CVU (22 números) | `0000003100012345678901` |
   | `TRANSFER_TITULAR` | el nombre del titular de la cuenta | `Nicolás Lunda` |
   | `TRANSFER_BANCO` | banco o billetera | `Mercado Pago`, `Brubank`, `Galicia`… |
   | `WHATSAPP_NUMERO` | tu WhatsApp para recibir comprobantes: 549 + código de área sin 0 + número sin 15 | `5491155555555` |

   El alias y el CBU los ves en la app de tu banco o billetera, en "Tus datos" o "Recibir dinero".
   Si no querés mostrar alguno, no lo cargues (alcanza con el alias o el CBU).

4. Tocá **Deploy** y esperá 1–2 minutos. Vas a ver tu dirección, del tipo
   **`https://sorteo-auto-xxxx.vercel.app`**.

La web ya está online, pero todavía sin cartones: le falta la base de datos.

---

## Paso 2 — Base de datos (desde Vercel)

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

## Paso 3 — Preparar la web

1. Abrí `https://TU-DIRECCION.vercel.app/admin`.
2. Entrá con la contraseña que pusiste en `ADMIN_PASSWORD`.
3. Tocá **Preparar la web**. En menos de un minuto aparece
   **"¡Listo! Se crearon 6000 cartones"**.

Abrí la página principal: ya se ven los cartones A-0001, A-0002…

---

## ✔ Reserva de prueba

1. Abrí tu web desde el celular. Elegí 3 cartones: el total tiene que dar **$15.000** (combo).
2. **Mi compra** → completá datos → **Reservar y ver datos para transferir**.
3. Tenés que ver tu alias, CBU, el monto y el botón verde de WhatsApp. Probá el botón:
   te abre WhatsApp con el mensaje armado.
4. Entrá a `/admin`: arriba aparece **Transferencias por confirmar** con esa reserva.
5. Como es una prueba, tocá **Cancelar**: los cartones vuelven a estar disponibles.
   (Si tocás **Confirmar pago**, quedarían como vendidos.)

¡Listo para compartir el link! 🚗

---

## Cómo atender las ventas (día a día)

1. Alguien reserva cartones: le aparecen tus datos bancarios y el monto exacto.
2. Te transfiere y te manda el comprobante por WhatsApp.
3. Revisás en tu banco que llegó la plata y en `/admin` tocás **✓ Confirmar pago**.
4. En la página de su compra (que se actualiza sola) le aparecen sus cartones con el botón
   **Descargar**.

Los cartones quedan apartados **24 horas** mientras esperás la transferencia. Si nadie
paga, tocá **Cancelar** y se liberan; si no hacés nada, se liberan solos a las 24 horas.
Confirmá los pagos dentro de ese plazo. (Las horas se cambian en `src/lib/config.ts`,
en `TRANSFERENCIA_HORAS`.)

Desde el panel, tocando el teléfono del comprador, le escribís directo por WhatsApp.

## Qué recibe el comprador

Cuando confirmás su pago, ve sus cartones en pantalla, con botones para **descargarlos
como imagen** o **compartirlos por WhatsApp**. Cada imagen tiene su nombre, el número de
cartón y el sello "PAGADO". También puede volver a verlos desde **Mis cartones**.

## Tu panel `/admin`

- Total recaudado, vendidos, disponibles y reservados en este momento.
- **Descargar lista de compradores (Excel)**: una fila por cartón vendido (cartón,
  nombre, DNI, email, teléfono, fecha). Usala el día del sorteo.
- **Transferencias por confirmar**: las reservas que esperan pago, con botones
  **Confirmar pago** y **Cancelar**.
- Compras marcadas **"Revisar"** (en rojo): pasa si confirmás un pago después de que la
  reserva venció y otra persona ya había comprado el mismo cartón. Contactala para darle
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
| La web dice "todavía no está conectada a la base de datos" | Hiciste el paso 2 pero falta el **Redeploy** del final. |
| "Preparar la web" muestra un error | Tocalo de nuevo. Si sigue, mandame una captura del mensaje. |
| Al reservar dice "Todavía no hay medios de pago configurados" | Falta `TRANSFER_ALIAS` o `TRANSFER_CBU` en Vercel. Cargalo y hacé **Redeploy**. |
| Cambié el alias y no se actualiza | Cada cambio de variables necesita **Redeploy**. |
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
   hacé **Redeploy** y seguí con el paso 3.

### Opcional: cobrar también con Mercado Pago (tarjeta)

La web puede ofrecer, además de la transferencia, el pago con tarjeta por Mercado Pago, con
confirmación automática. Si algún día lo querés: en <https://www.mercadopago.com.ar/developers>
creá una aplicación de **Checkout Pro**, copiá el **Access Token** de producción y cargalo en
Vercel como `MP_ACCESS_TOKEN` (+ Redeploy). El comprador va a poder elegir entre las dos formas
de pago.

---

## Importante: lo legal

En Argentina, las rifas y sorteos con venta de números suelen requerir **autorización de
la lotería provincial**, y los premios pagan impuestos. Antes de vender, consultá con un
contador o con la lotería de tu provincia.

La web vende los cartones; el sorteo de las bolillas (1 al 90) lo hacés vos en vivo,
usando la lista exportada para controlar los cartones ganadores.
