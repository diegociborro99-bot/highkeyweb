#!/usr/bin/env node
// Test de integración de la API de contacto con un mock de Resend.
// Ejecutar desde la raíz: node scripts/test-contact.mjs
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const MOCK_PORT = 4999;
const API_PORT = 3999;
const received = [];

// Mock de Resend: registra cada envío y responde OK
const mock = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    received.push({ path: req.url, auth: req.headers.authorization, payload: JSON.parse(body) });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: 'mock-' + received.length }));
  });
});
await new Promise((ok) => mock.listen(MOCK_PORT, '127.0.0.1', ok));

// Levanta la API apuntando al mock
const api = spawn('node', ['app/server.mjs'], {
  env: {
    ...process.env,
    API_PORT: String(API_PORT),
    RESEND_API_KEY: 're_test_123',
    RESEND_API_URL: `http://127.0.0.1:${MOCK_PORT}`,
    CONTACT_TO: 'diego@test.es',
    CONTACT_FROM: 'Highkey Labs <hola@highkeylabs.es>',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((ok) => api.stdout.once('data', ok));

const base = `http://127.0.0.1:${API_PORT}`;
let failed = 0;
function assert(name, cond) {
  console.log(`${cond ? '✅' : '❌'} ${name}`);
  if (!cond) failed++;
}
const post = (data) => fetch(`${base}/api/contact`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(data).toString(),
  redirect: 'manual',
});

// 1. Health con clave configurada
const health = await (await fetch(`${base}/api/health`)).json();
assert('health responde ready=true con clave', health.ready === true);

// 2. Envío válido → 2 emails + redirect de éxito
const r1 = await post({ nombre: 'Ana García', email: 'ana@clinica.es', mensaje: 'Quiero una web\ncon reservas' });
assert('envío válido redirige a /?enviado=1', r1.status === 303 && r1.headers.get('location') === '/?enviado=1');
assert('se envían exactamente 2 emails', received.length === 2);
const [interno, cliente] = received;
assert('interno va a CONTACT_TO con reply_to del cliente',
  interno?.payload.to[0] === 'diego@test.es' && interno?.payload.reply_to[0] === 'ana@clinica.es');
assert('interno lleva el mensaje escapado con saltos de línea',
  interno?.payload.html.includes('Quiero una web<br>con reservas'));
assert('cliente va al remitente con reply_to interno',
  cliente?.payload.to[0] === 'ana@clinica.es' && cliente?.payload.reply_to[0] === 'diego@test.es');
assert('cliente saluda por su nombre', cliente?.payload.html.includes('Ana García'));
assert('autenticación Bearer presente', interno?.auth === 'Bearer re_test_123');

// 3. Honeypot → éxito silencioso sin emails
const before = received.length;
const r2 = await post({ nombre: 'Bot', email: 'bot@spam.com', mensaje: 'spam', _honey: 'gotcha' });
assert('honeypot: redirect de éxito sin enviar nada', r2.status === 303 && r2.headers.get('location') === '/?enviado=1' && received.length === before);

// 4. Email inválido → error
const r3 = await post({ nombre: 'X', email: 'no-es-email', mensaje: 'hola' });
assert('email inválido redirige a /?enviado=0', r3.status === 303 && r3.headers.get('location') === '/?enviado=0' && received.length === before);

api.kill();
mock.close();

// 5. Sin clave: health not ready
const api2 = spawn('node', ['app/server.mjs'], {
  env: { ...process.env, API_PORT: String(API_PORT + 1), RESEND_API_KEY: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((ok) => api2.stdout.once('data', ok));
const health2 = await (await fetch(`http://127.0.0.1:${API_PORT + 1}/api/health`)).json();
assert('sin clave: health responde ready=false', health2.ready === false);
const r4 = await fetch(`http://127.0.0.1:${API_PORT + 1}/api/contact`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'nombre=A&email=a%40b.es&mensaje=hola',
  redirect: 'manual',
});
assert('sin clave: POST redirige a /?enviado=0 (no se pierde en silencio)', r4.status === 303 && r4.headers.get('location') === '/?enviado=0');
api2.kill();

console.log(failed ? `\n${failed} asserts en rojo` : '\nTodo en verde');
process.exit(failed ? 1 : 0);
