# Sitio estático de Highkey Labs servido con Caddy (imagen ~40 MB)
FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html legal.html styles.css main.js \
     logo.png shiftia-logo.svg shiftia-mockup.svg \
     hero.mp4 hero-poster.jpg \
     favicon-32.png apple-touch-icon.png og-image.png \
     robots.txt sitemap.xml /srv/
COPY fonts /srv/fonts

# Railway inyecta PORT; Caddy lo lee del Caddyfile ({$PORT})
EXPOSE 8080
