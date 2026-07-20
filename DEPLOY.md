# Deploy de highkeylabs — GitHub Desktop → Railway

## 1. Subir a GitHub (con GitHub Desktop)

1. Abre **GitHub Desktop** → `File > Add Local Repository…` y selecciona esta carpeta (`highkey-labs-web`).
   - Si dice que no es un repositorio, pulsa **"create a repository"** en el mismo diálogo (deja las opciones por defecto).
2. Escribe un mensaje de commit (p. ej. `web highkey labs v1`) → **Commit to main**.
3. Pulsa **Publish repository** → nómbralo `highkey-labs-web` → puedes marcarlo como **privado** → Publish.

## 2. Conectar Railway al repo

1. Entra en [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo**.
2. Autoriza tu cuenta de GitHub si es la primera vez y elige `highkey-labs-web`.
3. Railway detecta el `Dockerfile` automáticamente (el `railway.json` ya lo fuerza). No hay variables que configurar: el `PORT` lo inyecta Railway y Caddy lo lee solo.
4. Cuando el deploy esté en verde: **Settings → Networking → Generate Domain** para obtener la URL pública (`*.up.railway.app`).

Cada vez que hagas commit + push desde GitHub Desktop, Railway redespliega solo.

## 3. Dominio propio (opcional)

En Railway: **Settings → Networking → Custom Domain** → añade `highkeylabs.es` (o el que compres) y crea el registro CNAME que te indique en tu proveedor de dominio.

## 4. Pendientes antes de compartir la URL

- [ ] **Formulario**: el formulario ya envía vía [FormSubmit](https://formsubmit.co) a `diegociborro99@gmail.com`. El **primer envío** dispara un email de activación: haz clic en él una vez. Después, si quieres no exponer el email en el código, FormSubmit te da un alias aleatorio para sustituirlo en el `action`.
- [ ] **Testimonio**: cuando tengas una cita real de un cliente (nombre + cargo), sustituye el bloque "Confían en Shiftia" según el TODO del HTML.

## Variables en Railway (emails de presupuesto con plantillas propias)

Sin variables, el formulario funciona por FormSubmit (email básico). Para activar las
**plantillas de marca** (aviso interno para ti + confirmación bonita al cliente):

1. Crea cuenta gratis en [resend.com](https://resend.com) (3.000 emails/mes gratis).
2. En Resend → **Domains** → añade `highkeylabs.es` y crea en tu DNS los registros
   SPF/DKIM que te indica (2-3 registros TXT/CNAME). Espera a que verifique.
3. En Resend → **API Keys** → crea una clave.
4. En Railway → tu servicio → **Variables** → añade:

| Variable | Obligatoria | Valor |
|---|---|---|
| `RESEND_API_KEY` | ✅ | La clave de Resend (`re_...`) |
| `CONTACT_TO` | opcional | Dónde te llegan las solicitudes (por defecto `diegociborro99@gmail.com`) |
| `CONTACT_FROM` | opcional | Remitente (por defecto `Highkey Labs <hola@highkeylabs.es>`; el dominio debe estar verificado en Resend) |

Railway redespliega solo al guardar. El formulario detecta la API automáticamente
(`/api/health`) y empieza a usar las plantillas — sin tocar código. `PORT` sigue
siendo automático; no hace falta nada más.

## Regenerar el CSS

El CSS de Tailwind está compilado en `styles.css` (ya no se usa el CDN). Si cambias clases en `index.html`, `legal.html` o `main.js`, recompila:

```bash
npx -y tailwindcss@3.4.17 -i src/input.css -o styles.css --content "index.html,legal.html,main.js" --minify
```

Y ejecuta las verificaciones: `node scripts/checks.mjs`.

## Qué hace cada archivo

| Archivo | Para qué |
|---|---|
| `Dockerfile` | Imagen mínima con Caddy que sirve el sitio |
| `Caddyfile` | Escucha en `$PORT`, compresión, caché, CSP y cabeceras de seguridad |
| `railway.json` | Le dice a Railway que use el Dockerfile y el healthcheck en `/` |
| `styles.css` / `src/input.css` | CSS compilado de Tailwind y su fuente (fuentes self-hosted + estilos custom) |
| `main.js` | Todo el JS del sitio (menú, animaciones, vídeo, formulario) |
| `legal.html` | Aviso legal + política de privacidad (RGPD) |
| `hero.mp4` / `hero-poster.jpg` | Vídeo del hero self-hosted y su póster de carga |
| `og-image.png` | Imagen al compartir en WhatsApp/LinkedIn/Twitter |
| `scripts/checks.mjs` | Verificaciones del sitio (`node scripts/checks.mjs`) |
| `.dockerignore` | Deja fuera de la imagen los archivos de desarrollo |
| `.gitignore` | Evita subir basura del sistema al repo |
