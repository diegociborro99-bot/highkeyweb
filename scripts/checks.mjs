#!/usr/bin/env node
// Harness de verificación del sitio. Ejecutar desde la raíz: node scripts/checks.mjs
// Cada check descrito aquí es un invariante del sitio publicado.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const results = [];
function check(name, fn) {
  try {
    const ok = fn();
    results.push({ name, ok: ok !== false, why: ok === false ? 'condición falsa' : '' });
  } catch (e) {
    results.push({ name, ok: false, why: e.message.split('\n')[0] });
  }
}
const read = (p) => readFileSync(p, 'utf8');

const index = read('index.html');
const caddy = read('Caddyfile');
const docker = read('Dockerfile');

// --- Rendimiento / dependencias externas ---
check('sin Tailwind CDN en producción', () => !index.includes('cdn.tailwindcss.com'));
check('sin Google Fonts remoto', () => !index.includes('fonts.googleapis.com'));
check('vídeo del hero self-hosted (no cdn.sceneai.art)', () => !index.includes('cdn.sceneai.art') && existsSync('hero.mp4'));
check('mockup de Shiftia self-hosted', () => !index.includes('shiftia.es/product-mockup') && existsSync('shiftia-mockup.svg'));
check('vídeo con poster y preload=metadata', () => /<video[^>]*poster="[^"]+"/.test(index) && /<video[^>]*preload="metadata"/.test(index));
check('styles.css compilado existe y es real (>5KB, con utilidades y @font-face)', () => {
  const css = read('styles.css');
  return statSync('styles.css').size > 5000 && css.includes('@font-face') && /md\\:/.test(css) && css.includes('.reveal');
});
check('fuentes self-hosted en fonts/ (≥3 woff2: Inter var + Instrument Serif)', () =>
  existsSync('fonts') && readdirSync('fonts').filter((f) => f.endsWith('.woff2')).length >= 3);
check('logo.png optimizado (<30KB)', () => statSync('logo.png').size < 30000);

// --- Formulario / conversión ---
check('formulario sin placeholder TU_ID', () => !index.includes('TU_ID'));
check('formulario apunta a FormSubmit', () => /action="https:\/\/formsubmit\.co\/[^"]+"/.test(index));
check('formulario con honeypot _honey', () => index.includes('name="_honey"'));
check('formulario con checkbox de privacidad enlazando a legal', () =>
  /type="checkbox"[^>]*name="privacidad"[^>]*required|name="privacidad"[^>]*type="checkbox"/.test(index.replace(/\n/g, ' ')) &&
  /legal\.html/.test(index));
check('mensaje de éxito de envío presente', () => index.includes('id="formOk"'));

// --- SEO ---
check('canonical a www.highkeylabs.es', () => index.includes('rel="canonical"') && index.includes('https://www.highkeylabs.es/'));
check('og:url + og:image + twitter card + theme-color', () =>
  index.includes('property="og:url"') && index.includes('property="og:image"') &&
  index.includes('name="twitter:card"') && index.includes('name="theme-color"'));
check('og-image.png existe y pesa algo (>10KB)', () => statSync('og-image.png').size > 10000);
check('JSON-LD válido con Organization + FAQPage + SoftwareApplication', () => {
  const blocks = [...index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const types = JSON.stringify(blocks);
  return blocks.length > 0 && types.includes('Organization') && types.includes('FAQPage') && types.includes('SoftwareApplication');
});
check('FAQPage cubre las 5 preguntas del acordeón', () => {
  const blocks = [...index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const faq = JSON.stringify(blocks).match(/"Question"/g) || [];
  const details = index.match(/<details/g) || [];
  return faq.length >= details.length && details.length >= 5;
});
check('robots.txt y sitemap.xml existen', () => existsSync('robots.txt') && existsSync('sitemap.xml'));
check('favicons reales (32px + apple-touch-icon)', () =>
  existsSync('favicon-32.png') && existsSync('apple-touch-icon.png') && index.includes('apple-touch-icon'));

// --- Accesibilidad ---
check('skip link + <main>', () => index.includes('Saltar al contenido') && /<main[\s>]/.test(index));
check('sin grises por debajo de contraste AA (text-black/35, /40, /45)', () =>
  !/text-black\/(35|40|45)[^0-9]/.test(index));
check('imágenes de contenido con width/height', () => {
  const imgs = [...index.matchAll(/<img [^>]+>/g)].map((m) => m[0]);
  return imgs.every((t) => (t.includes('width=') && t.includes('height=')) || t.includes('aria-hidden="true"'));
});

// --- Código ---
check('JS externo main.js (sin script inline salvo JSON-LD)', () => {
  const inline = [...index.matchAll(/<script(?![^>]*src=)([^>]*)>/g)].filter((m) => !m[1].includes('ld+json'));
  return index.includes('src="main.js"') && inline.length === 0;
});
check('main.js pasa node --check', () => {
  execFileSync('node', ['--check', 'main.js']);
  return true;
});
check('referencias locales de index.html existen en disco', () => {
  const refs = [...index.matchAll(/(?:src|href)="([^"#][^"]*)"/g)].map((m) => m[1])
    .filter((u) => !/^(https?:|mailto:|tel:|#|data:)/.test(u)).map((u) => u.split('#')[0].split('?')[0]);
  const missing = refs.filter((r) => !existsSync(r));
  if (missing.length) throw new Error('faltan: ' + missing.join(', '));
  return true;
});

check('proceso como flujo animado (dot en la línea + nodos con pulso)', () => {
  const css = read('styles.css');
  return index.includes('proc-dot') && (index.match(/class="proc-num/g) || []).length === 4 &&
    css.includes('procMove') && css.includes('procPulse') && css.includes('procNumActive');
});

check('contacto más visual (borde conic animado + blobs de ambiente)', () => {
  const css = read('styles.css');
  return index.includes('contact-card') && index.includes('cb-1') && index.includes('cb-2') &&
    css.includes('caSpin') && css.includes('drift1');
});
check('sin correos visibles en la landing (ningún mailto: en index)', () => !index.includes('mailto:'));
check('footer sin la descripción del estudio (solo texto visible)', () =>
  !(index.split('<footer')[1] || '').includes('Estudio digital'));

// --- Legal ---
check('legal.html existe con privacidad y aviso legal', () => {
  const legal = read('legal.html');
  return legal.includes('id="privacidad"') && legal.includes('id="aviso-legal"') && legal.includes('RGPD');
});
check('footer enlaza a legal.html', () => index.split('<footer')[1]?.includes('legal.html'));

// --- Servidor / imagen ---
check('Caddyfile con CSP y HSTS', () => caddy.includes('Content-Security-Policy') && caddy.includes('Strict-Transport-Security'));
check('Caddyfile cachea css/js/mp4/woff2', () => ['*.css', '*.js', '*.mp4', '*.woff2'].every((e) => caddy.includes(e)));
check('Dockerfile copia todos los ficheros nuevos', () =>
  ['styles.css', 'main.js', 'legal.html', 'hero.mp4', 'robots.txt', 'sitemap.xml', 'fonts'].every((f) => docker.includes(f)));

// --- Sistema de presupuestos (plantillas + API) ---
check('app/server.mjs y app/templates.mjs pasan node --check', () => {
  execFileSync('node', ['--check', 'app/server.mjs']);
  execFileSync('node', ['--check', 'app/templates.mjs']);
  return true;
});
await (async () => {
  let t = null;
  try { t = await import('../app/templates.mjs'); } catch { /* aún no existe */ }
  const datos = { nombre: 'Ana', email: 'ana@clinica.es', mensaje: 'Quiero <script>alert(1)</script> una web', fecha: '20/07/2026 21:00' };
  check('plantilla interna: logo, datos, mailto y escape de HTML', () => {
    if (!t) return false;
    const { subject, html } = t.internalEmail(datos);
    return subject.includes('Ana') && html.includes('https://www.highkeylabs.es/logo.png') &&
      html.includes('ana@clinica.es') && html.includes('mailto:ana@clinica.es') &&
      html.includes('&lt;script&gt;') && !html.includes('<script>alert') && !html.includes('undefined');
  });
  check('plantilla cliente: saludo, pasos, CTA a la web y sin fugas', () => {
    if (!t) return false;
    const { subject, html } = t.clientEmail(datos);
    return subject.length > 0 && subject.length < 80 && html.includes('Ana') &&
      html.includes('https://www.highkeylabs.es') && html.includes('24 h') &&
      html.includes('legal.html') && !html.includes('undefined');
  });
})();
check('Caddyfile enruta /api/* al servidor Node', () => caddy.includes('reverse_proxy') && caddy.includes('/api/*'));
check('Dockerfile instala Node y arranca API + Caddy', () =>
  docker.includes('nodejs') && docker.includes('app') && docker.includes('server.mjs'));
check('main.js cambia el formulario a la API cuando está lista', () => {
  const js = read('main.js');
  return js.includes('/api/health') && js.includes('/api/contact');
});
check('banner de error de envío presente', () => index.includes('id="formErr"'));
check('privacidad menciona Resend como encargado', () => read('legal.html').includes('Resend'));

// --- Informe ---
let fails = 0;
for (const r of results) {
  if (!r.ok) fails++;
  console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.why ? ' — ' + r.why : ''}`);
}
console.log(`\n${results.length - fails}/${results.length} checks en verde`);
process.exit(fails ? 1 : 0);
