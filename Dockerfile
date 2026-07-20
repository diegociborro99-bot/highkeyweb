# Web de Highkey Labs: Caddy sirve el estático y proxya /api/* a la API Node
# de contacto (envío de presupuestos con plantillas propias vía Resend).
FROM caddy:2-alpine

RUN apk add --no-cache nodejs

COPY Caddyfile /etc/caddy/Caddyfile
COPY app /srv/app
COPY index.html legal.html styles.css main.js \
     logo.png shiftia-logo.svg shiftia-mockup.svg \
     hero.mp4 hero-poster.jpg \
     favicon-32.png apple-touch-icon.png og-image.png \
     robots.txt sitemap.xml /srv/
COPY fonts /srv/fonts

# Railway inyecta PORT; Caddy lo lee del Caddyfile ({$PORT})
EXPOSE 8080
CMD ["sh", "-c", "node /srv/app/server.mjs & exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]
