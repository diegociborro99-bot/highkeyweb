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

- [ ] **Formulario**: crea un form gratis en [formspree.io](https://formspree.io), copia tu ID y sustituye `TU_ID` en el `action` del formulario de `index.html`. Hasta entonces el formulario no envía.
- [ ] El vídeo del hero y la imagen del producto cargan desde CDNs externos (`cdn.sceneai.art` y `shiftia.es`). Funcionan, pero si quieres independencia total, descárgalos y sírvelos desde esta carpeta.

## Qué hace cada archivo

| Archivo | Para qué |
|---|---|
| `Dockerfile` | Imagen mínima con Caddy que sirve el sitio |
| `Caddyfile` | Escucha en `$PORT`, compresión, caché y cabeceras de seguridad |
| `railway.json` | Le dice a Railway que use el Dockerfile y el healthcheck en `/` |
| `.dockerignore` | Deja fuera de la imagen el JPG fuente y archivos de desarrollo |
| `.gitignore` | Evita subir basura del sistema al repo |
