# Guía paso a paso para poner tu web online

Esta guía está pensada para alguien **sin experiencia técnica**. Seguila en orden.
Calculá una hora y media en total. No hace falta instalar nada en tu computadora:
todo se hace desde el navegador.

---

## Antes de empezar: ¿qué es cada cosa?

Tu web usa tres servicios. Pensalo como un local:

| Servicio | Qué hace | Analogía |
|---|---|---|
| **GitHub** | Guarda el código de la web (ya lo tenés: es donde está este archivo). | Los planos del local |
| **Supabase** | La base de datos: guarda los 6.000 cartones, quién compró cada uno y qué cartones están reservados. | El cuaderno donde anotás todo |
| **Vercel** | Publica la web en internet para que cualquiera la abra. | El local abierto al público |
| **Mercado Pago** | Cobra y avisa a la web cuando un pago se aprobó. | La caja registradora |

Los tres tienen plan **gratuito**, alcanza para este sorteo. Mercado Pago cobra su
comisión normal sobre cada venta.

Vas a ir copiando unas "claves" de un servicio a otro. **Abrí un archivo de notas**
(Bloc de notas, Notas del celular, etc.) para ir guardándolas a medida que aparecen:

```
SUPABASE_URL =
SUPABASE_SERVICE_ROLE_KEY =
MP_ACCESS_TOKEN =
MP_WEBHOOK_SECRET =
ADMIN_PASSWORD =
NEXT_PUBLIC_SITE_URL =
```

> ⚠️ **Las claves son como las llaves de tu casa.** No las mandes por WhatsApp,
> no las publiques y no las pegues en ningún lado que no sea Vercel.

---

## Paso 0 — Juntar el código en la rama principal de GitHub

El código de la web está en una rama (una "versión en borrador") llamada
`claude/bingo-lottery-ticket-platform-8a6z03`. Hay que pasarla a la rama principal.

1. Entrá a <https://github.com/nicolaslunda2-boop/Sorteo-auto>.
2. Si ves un cartel amarillo que dice **"claude/bingo-… had recent pushes"**, hacé clic
   en **Compare & pull request**. Si no aparece: pestaña **Pull requests** →
   **New pull request** → en "compare" elegí la rama `claude/bingo-lottery-ticket-platform-8a6z03`.
3. Clic en **Create pull request** y después en **Merge pull request** → **Confirm merge**.

Listo: el código ya está en la rama principal (`main`).

---

## Paso 1 — Supabase (la base de datos)

### 1.1 Crear la cuenta y el proyecto

1. Entrá a <https://supabase.com> y tocá **Start your project**.
2. Elegí **Continue with GitHub** (así usás la misma cuenta; más fácil).
3. Te va a pedir crear una **organización**: poné tu nombre, plan **Free**.
4. Clic en **New project** y completá:
   - **Name:** `sorteo-auto`
   - **Database Password:** tocá **Generate a password** y **guardala en tus notas**
     (no la vas a necesitar seguido, pero no la pierdas).
   - **Region:** elegí **South America (São Paulo)** — es la más cercana a Argentina,
     la web va a andar más rápido.
   - Si aparece la opción **"Enable Data API"**, dejala **activada**.
5. Clic en **Create new project** y esperá 1–2 minutos hasta que termine.

### 1.2 Crear las tablas (copiar y pegar)

1. En el menú de la izquierda, entrá a **SQL Editor** (ícono `>_`).
2. Clic en **New query** (o el botón **+**).
3. En GitHub, abrí el archivo [`supabase/schema.sql`](supabase/schema.sql), tocá el
   botón **Copy raw file** (ícono de dos hojitas) y pegalo entero en el editor de Supabase.
4. Clic en **Run** (abajo a la derecha).
5. Debería decir **"Success. No rows returned"**. Si aparece un aviso sobre
   "destructive operation", confirmá con **Run this query**.

Esto crea el "cuaderno" con todo lo necesario: cartones, pedidos, reservas que se
vencen solas a los 15 minutos y la búsqueda por números favoritos.

### 1.3 Copiar las claves

1. Arriba, tocá el botón **Connect** (o andá a **Project Settings** → **Data API**).
   Copiá la **Project URL** (algo como `https://abcdefgh.supabase.co`)
   → en tus notas, en `SUPABASE_URL`.
2. Andá a **Project Settings** (ícono de engranaje) → **API Keys**.
   - Si ves una sección **Secret keys**, copiá la que empieza con `sb_secret_…`
     (tocá el ojito o **Reveal** para verla).
   - Si en cambio ves la pestaña **Legacy API keys**, copiá la **`service_role`**.

   → en tus notas, en `SUPABASE_SERVICE_ROLE_KEY`.

> ❗ No uses la clave **anon** / **publishable**: esa no sirve para esto.

---

## Paso 2 — Mercado Pago Developers (los cobros)

Necesitás una cuenta de Mercado Pago normal (la misma con la que vas a recibir la plata).

### 2.1 Crear la aplicación

1. Entrá a <https://www.mercadopago.com.ar/developers> e iniciá sesión con tu cuenta de
   Mercado Pago.
2. Arriba a la derecha, **Tus integraciones** → **Crear aplicación**.
3. Completá:
   - **Nombre:** `Sorteo Auto`
   - **¿Qué tipo de solución vas a integrar?** → **Pagos online**.
   - **¿Estás usando una plataforma de e-commerce?** → **No**.
   - **¿Qué producto vas a integrar?** → **Checkout Pro**.
4. Aceptá los términos y tocá **Crear aplicación**.

### 2.2 Credenciales de PRUEBA (para probar sin plata real)

1. Dentro de tu aplicación, menú izquierdo → **Credenciales de prueba**.
2. Copiá el **Access Token** (empieza con `TEST-…` o `APP_USR-…`)
   → en tus notas, en `MP_ACCESS_TOKEN`.

### 2.3 Cuenta de comprador de prueba

Mercado Pago no deja que te pagues a vos mismo, así que para probar necesitás
un "comprador de mentira":

1. Menú izquierdo → **Cuentas de prueba** → **Crear cuenta de prueba**.
2. Descripción: `Comprador`, País: **Argentina**, saldo: `50000` (dinero ficticio).
3. Guardá el **usuario** y la **contraseña** que te muestra.

El Webhook (aviso automático de pagos) lo configuramos en el Paso 4, cuando la web
ya tenga dirección.

---

## Paso 3 — Vercel (publicar la web)

### 3.1 Crear la cuenta e importar el proyecto

1. Entrá a <https://vercel.com/signup>, elegí **Hobby** (gratis) y **Continue with GitHub**.
2. Clic en **Add New…** → **Project**.
3. En la lista aparece `Sorteo-auto` → **Import**. (Si no aparece, tocá
   **Adjust GitHub App Permissions** y dale acceso a ese repositorio.)
4. **No toques** "Framework Preset" ni "Build Settings": ya detecta todo solo (Next.js).

### 3.2 Cargar las variables (las claves)

Antes de tocar **Deploy**, abrí la sección **Environment Variables** y cargá una por una
(nombre a la izquierda, valor a la derecha, botón **Add**):

| Nombre (Key) | Valor |
|---|---|
| `SUPABASE_URL` | la de tus notas |
| `SUPABASE_SERVICE_ROLE_KEY` | la de tus notas |
| `MP_ACCESS_TOKEN` | el de PRUEBA, de tus notas |
| `ADMIN_PASSWORD` | inventá una contraseña larga para tu panel (ej: `Auto-Sorteo-2026-xK9!`) |

> 💡 Truco: podés pegar todo el bloque de una vez en el primer casillero, con el
> formato `NOMBRE=valor` (una por línea) y Vercel lo separa solo.

Ahora sí: **Deploy**. Tarda 1–2 minutos. Cuando termine vas a ver fuegos artificiales 🎉
y una dirección del tipo **`https://sorteo-auto-xxxx.vercel.app`**.

### 3.3 Avisarle a la web cuál es su dirección

1. Copiá esa dirección (sin barra `/` al final) → en tus notas, en `NEXT_PUBLIC_SITE_URL`.
2. En Vercel: tu proyecto → **Settings** → **Environment Variables** → agregá
   `NEXT_PUBLIC_SITE_URL` con esa dirección → **Save**.
3. Pestaña **Deployments** → en el primero de la lista, los tres puntitos **⋯** →
   **Redeploy** → **Redeploy**. (Cada vez que cambies una variable hay que hacer esto.)

### 3.4 Crear los 6.000 cartones

1. Abrí `https://TU-DIRECCION.vercel.app/admin`.
2. Entrá con la contraseña que pusiste en `ADMIN_PASSWORD`.
3. Vas a ver **"Primer paso: crear los cartones"** → **Crear los 6.000 cartones**.
4. En unos segundos aparece "Listo: se crearon 6000 cartones".

Abrí la página principal: ya deberías ver los cartones A-0001, A-0002…

---

## Paso 4 — Webhook de Mercado Pago (confirmación automática)

El webhook es el "aviso" que Mercado Pago le manda a tu web cuando alguien paga,
para que el cartón quede marcado como **vendido** automáticamente.

1. Volvé a Mercado Pago Developers → **Tus integraciones** → tu aplicación.
2. Menú izquierdo → **Webhooks** → **Configurar notificaciones**.
3. Completá **las dos** pestañas (Modo de prueba y Modo productivo) con la misma URL:

   ```
   https://TU-DIRECCION.vercel.app/api/webhooks/mercadopago
   ```

4. En **Eventos**, marcá solo **Pagos**.
5. **Guardar configuración**.
6. Aparece una **Clave secreta** (tocá el ojito para verla) → copiala → en tus notas,
   en `MP_WEBHOOK_SECRET`.
7. En Vercel → **Settings** → **Environment Variables** → agregá `MP_WEBHOOK_SECRET`
   → **Save** → **Deployments** → **Redeploy**.

> La clave secreta sirve para que la web compruebe que el aviso viene de verdad de
> Mercado Pago y no de un tramposo.

---

## Paso 5 — Hacer una compra de prueba

1. Abrí tu web en una **ventana de incógnito** (así no estás logueado con tu Mercado Pago real).
2. Elegí 3 cartones → fijate que el total sea **$15.000** (combo).
3. **Ir a pagar** → completá datos inventados → **Pagar con Mercado Pago**.
4. En Mercado Pago, iniciá sesión con el **comprador de prueba** del paso 2.3.
5. Pagá con esta **tarjeta de prueba**:
   - Número: `5031 7557 3453 0604` (Mastercard)
   - Vencimiento: `11/30` · Código: `123`
   - Nombre del titular: **`APRO`** (esa palabra hace que el pago se apruebe)
   - DNI: `12345678`
6. Al terminar, volvés a tu web y aparece **"¡Felicitaciones!"** con los números de cartón.
7. Entrá a `/admin`: tenés que ver la compra, $15.000 recaudados y 3 cartones vendidos.
   Probá el botón **Descargar lista de compradores (Excel)**.

Si querés probar un pago rechazado, usá como nombre del titular `OTHE`.

---

## Paso 6 — Pasar a cobros REALES

Cuando la prueba salió bien:

1. Mercado Pago Developers → tu aplicación → **Credenciales de producción**.
   Puede pedirte completar datos del negocio (rubro, sitio web: poné tu dirección de Vercel).
   Copiá el **Access Token** de producción (empieza con `APP_USR-…`).
2. En Vercel → **Settings** → **Environment Variables** → buscá `MP_ACCESS_TOKEN` →
   los tres puntitos → **Edit** → pegá el token de producción → **Save**.
3. **Deployments** → **Redeploy**.
4. Hacé **una compra real de 1 cartón** con otra persona (tu tarjeta en la cuenta de un
   familiar, por ejemplo) para confirmar que todo funciona. Después podés devolver ese
   pago desde tu Mercado Pago (Actividad → el pago → Devolver).

¡Listo! Ya podés compartir el link. 🚗

---

## Uso diario del panel `/admin`

- **Total recaudado**, **vendidos**, **disponibles** y **reservados ahora** (gente que
  está en medio de una compra).
- **Descargar lista de compradores**: un archivo que abre en Excel con una fila por
  cartón vendido (cartón, nombre, DNI, email, teléfono, fecha, ID de pago).
  Usalo para el día del sorteo.
- Compras marcadas **"Revisar"** (en rojo): casos rarísimos en que alguien pagó tarde,
  cuando su reserva ya había vencido y otra persona compró el mismo cartón. Contactá
  a esa persona para darle otro cartón o devolverle el dinero desde Mercado Pago.

## Cambiar textos, fecha o precios

Todo está en un solo archivo: [`src/lib/config.ts`](src/lib/config.ts).
Para editarlo: abrilo en GitHub → ícono del lápiz ✏️ → cambiá lo que está entre comillas
(por ejemplo `fecha: "Fecha a confirmar"` → `fecha: "Sábado 20 de diciembre, 21 h"`) →
**Commit changes**. Vercel publica la nueva versión sola en 1–2 minutos.

> No cambies `SEMILLA_CARTONES` ni `TOTAL_TICKETS` una vez creados los cartones.

---

## Si algo no funciona

| Problema | Solución |
|---|---|
| La web dice "todavía no está conectada a la base de datos" | Revisá `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Vercel y hacé **Redeploy**. |
| En `/admin` dice "No se pudo leer la base de datos" | Volvé a ejecutar `supabase/schema.sql` en el SQL Editor (Paso 1.2). |
| "No pudimos conectar con Mercado Pago" | Revisá `MP_ACCESS_TOKEN` (sin espacios al principio o final) y hacé **Redeploy**. |
| Pagué pero el cartón no figura vendido | Revisá la URL del webhook (Paso 4) y que `NEXT_PUBLIC_SITE_URL` sea tu dirección real. En Mercado Pago → Webhooks podés ver si los avisos dan error. |
| "Firma inválida" en los avisos del webhook | La `MP_WEBHOOK_SECRET` en Vercel no coincide con la de Mercado Pago. Copiala de nuevo y **Redeploy**. |
| Supabase pausó el proyecto | En el plan gratuito, si nadie usa la web por 7 días Supabase la "duerme". Entrá a supabase.com y tocá **Restore project**. Con ventas activas no pasa. |

---

## Importante: lo legal

En Argentina, las rifas y sorteos con venta de números suelen requerir **autorización
de la lotería provincial** (por ejemplo, Lotería de la Ciudad o el Instituto de Lotería
de tu provincia) y los premios pagan impuestos. Antes de vender, consultá con un
contador o con la lotería de tu provincia para hacerlo en regla. Esta web registra
todo (comprador, DNI, pago) para que tengas la documentación ordenada.

La web **vende los cartones**; el sorteo de las bolillas (del 1 al 90) lo hacés vos
en vivo, usando la lista exportada para verificar los cartones ganadores.
