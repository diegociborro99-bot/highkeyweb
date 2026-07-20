// API de contacto de highkeylabs.es — corre detrás de Caddy en el mismo contenedor.
// POST /api/contact: valida el formulario y envía dos correos vía Resend
// (aviso interno + confirmación al cliente). GET /api/health: estado de configuración.
import { createServer } from 'node:http';
import { internalEmail, clientEmail } from './templates.mjs';

const PORT = Number(process.env.API_PORT || 3000);
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_API_URL = process.env.RESEND_API_URL || 'https://api.resend.com';
const CONTACT_TO = process.env.CONTACT_TO || 'diegociborro99@gmail.com';
const CONTACT_FROM = process.env.CONTACT_FROM || 'Highkey Labs <hola@highkeylabs.es>';

function redirect(res, to) {
  res.writeHead(303, { Location: to });
  res.end();
}

async function sendEmail(payload) {
  const r = await fetch(`${RESEND_API_URL}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) { throw new Error(`Resend ${r.status}: ${await r.text()}`); }
  return r.json();
}

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ready: Boolean(RESEND_API_KEY) }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/contact') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 50000) { req.destroy(); } });
    req.on('end', async () => {
      try {
        const form = new URLSearchParams(body);
        const nombre = (form.get('nombre') || '').trim().slice(0, 200);
        const email = (form.get('email') || '').trim().slice(0, 200);
        const mensaje = (form.get('mensaje') || '').trim().slice(0, 5000);

        // Honeypot: a los bots se les responde éxito sin enviar nada
        if (form.get('_honey')) { return redirect(res, '/?enviado=1'); }
        if (!nombre || !mensaje || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return redirect(res, '/?enviado=0');
        }
        if (!RESEND_API_KEY) { return redirect(res, '/?enviado=0'); }

        const fecha = new Intl.DateTimeFormat('es-ES', {
          dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid',
        }).format(new Date());

        // 1) Aviso interno — reply_to el cliente para responder con un clic
        const interno = internalEmail({ nombre, email, mensaje, fecha });
        await sendEmail({ from: CONTACT_FROM, to: [CONTACT_TO], reply_to: [email], subject: interno.subject, html: interno.html });

        // 2) Confirmación al cliente — no fatal si falla: el aviso interno ya salió
        try {
          const cliente = clientEmail({ nombre });
          await sendEmail({ from: CONTACT_FROM, to: [email], reply_to: [CONTACT_TO], subject: cliente.subject, html: cliente.html });
        } catch (e) {
          console.error('auto-respuesta al cliente falló:', e.message);
        }
        return redirect(res, '/?enviado=1');
      } catch (e) {
        console.error('error en /api/contact:', e.message);
        return redirect(res, '/?enviado=0');
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`API de contacto en 127.0.0.1:${PORT} — Resend ${RESEND_API_KEY ? 'configurado' : 'SIN configurar (el formulario seguirá en FormSubmit)'}`);
});
