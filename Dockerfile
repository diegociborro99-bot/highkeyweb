# Sitio estático de Highkey Labs servido con Caddy (imagen ~40 MB)
FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html logo.png shiftia-logo.svg /srv/

# Railway inyecta PORT; Caddy lo lee del Caddyfile ({$PORT})
EXPOSE 8080
