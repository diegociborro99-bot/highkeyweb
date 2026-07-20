// Plantillas de email transaccional de Highkey Labs.
// Email-safe: tablas, CSS inline, 600px, fuentes de sistema (Georgia hace de
// serif display porque las webfonts no cargan de forma fiable en Gmail/Outlook).

const WEB = 'https://www.highkeylabs.es';
const PURPLE = '#7e22ce';
const PURPLE_DEEP = '#6d28d9';
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function layout({ preheader, kicker, headline, bodyRows, cta, note }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#eeeeee;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eeeeee;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:100%;">

        <!-- Marca -->
        <tr><td style="padding:0 8px 24px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td><img src="${WEB}/logo.png" alt="Highkey Labs" width="44" height="28" style="display:block; border:0;"></td>
            <td style="padding-left:10px; font-family:${SANS}; font-size:15px; font-weight:700; color:#111111; letter-spacing:-0.2px;">Highkey Labs</td>
          </tr></table>
        </td></tr>

        <!-- Tarjeta -->
        <tr><td style="background-color:#ffffff; border-radius:24px; padding:40px 40px 36px 40px; border:1px solid #e2e2e2;">
          <p style="margin:0 0 14px 0; font-family:${SANS}; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#8a8a8a;">${kicker}</p>
          <h1 style="margin:0 0 18px 0; font-family:${SERIF}; font-weight:400; font-size:30px; line-height:1.15; color:#111111;">${headline}</h1>
          ${bodyRows}
          ${cta ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 6px 0;"><tr>
            <td style="border-radius:999px; background-color:${PURPLE};">
              <a href="${cta.href}" style="display:inline-block; padding:14px 30px; font-family:${SANS}; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:999px;">${cta.label}</a>
            </td>
          </tr></table>` : ''}
          ${note ? `<p style="margin:18px 0 0 0; font-family:${SANS}; font-size:13px; line-height:1.6; color:#8a8a8a;">${note}</p>` : ''}
        </td></tr>

        <!-- Pie -->
        <tr><td style="padding:24px 8px 0 8px; font-family:${SANS}; font-size:12px; line-height:1.7; color:#9a9a9a;">
          © Highkey Labs · Web, IA y automatización ·
          <a href="${WEB}/legal.html" style="color:#9a9a9a; text-decoration:underline;">Aviso legal y privacidad</a><br>
          Recibes este correo en relación con una solicitud de presupuesto en highkeylabs.es.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function dataRow(label, value, extraStyle = '') {
  return `<tr>
    <td style="padding:12px 16px; font-family:${SANS}; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#8a8a8a; vertical-align:top; width:110px; border-bottom:1px solid #f0f0f0;">${label}</td>
    <td style="padding:12px 16px; font-family:${SANS}; font-size:15px; line-height:1.6; color:#222222; border-bottom:1px solid #f0f0f0; ${extraStyle}">${value}</td>
  </tr>`;
}

// ── Email interno: nueva solicitud de presupuesto ──────────────────────────
export function internalEmail({ nombre, email, mensaje, fecha }) {
  const n = escapeHtml(nombre);
  const e = escapeHtml(email);
  const m = escapeHtml(mensaje).replace(/\r?\n/g, '<br>');
  const f = escapeHtml(fecha);
  return {
    subject: `Nueva solicitud de presupuesto — ${nombre}`,
    html: layout({
      preheader: `${nombre} acaba de escribir desde highkeylabs.es`,
      kicker: 'Nueva solicitud de presupuesto',
      headline: `Alguien quiere <em style="font-style:italic; color:${PURPLE_DEEP};">empezar</em>.`,
      bodyRows: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #ececec; border-radius:14px; margin-top:6px;">
          ${dataRow('Nombre', n)}
          ${dataRow('Email', `<a href="mailto:${e}" style="color:${PURPLE_DEEP}; text-decoration:none; font-weight:600;">${e}</a>`)}
          ${dataRow('Mensaje', m)}
          ${dataRow('Recibido', f, 'border-bottom:none;')}
        </table>`,
      cta: { href: `mailto:${e}?subject=${encodeURIComponent('Re: tu proyecto con Highkey Labs')}`, label: `Responder a ${n}` },
      note: 'También puedes responder directamente a este correo: el remitente ya es el cliente.',
    }),
  };
}

// ── Email al cliente: confirmación de solicitud ────────────────────────────
export function clientEmail({ nombre }) {
  const n = escapeHtml(nombre);
  const step = (num, titulo, texto, last = false) => `<tr>
    <td style="vertical-align:top; padding:${last ? '14px 0 0 0' : '14px 0'}; width:44px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" style="width:30px; height:30px; border-radius:999px; background-color:#f3e8ff; font-family:${SANS}; font-size:12px; font-weight:700; color:${PURPLE_DEEP};">${num}</td>
      </tr></table>
    </td>
    <td style="vertical-align:top; padding:${last ? '14px 0 0 8px' : '14px 0 14px 8px'}; ${last ? '' : 'border-bottom:1px solid #f0f0f0;'}">
      <p style="margin:0; font-family:${SANS}; font-size:14px; font-weight:700; color:#111111;">${titulo}</p>
      <p style="margin:3px 0 0 0; font-family:${SANS}; font-size:14px; line-height:1.6; color:#666666;">${texto}</p>
    </td>
  </tr>`;
  return {
    subject: 'Hemos recibido tu solicitud — te respondemos en menos de 24 h',
    html: layout({
      preheader: 'Tu proyecto ya está en nuestra mesa. Esto es lo que pasa ahora.',
      kicker: 'Solicitud recibida',
      headline: `Gracias, ${n}. Tu proyecto ya está <em style="font-style:italic; color:${PURPLE_DEEP};">en marcha</em>.`,
      bodyRows: `
        <p style="margin:0 0 10px 0; font-family:${SANS}; font-size:15px; line-height:1.7; color:#444444;">Hemos recibido tu mensaje y ya lo estamos leyendo. Esto es lo que pasa a partir de ahora:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
          ${step('01', 'Hoy', 'Leemos tu caso con calma y estudiamos cómo encajarlo.')}
          ${step('02', 'En menos de 24 h', 'Te enviamos una propuesta honesta: alcance, plazos y precio cerrado.')}
          ${step('03', 'Si te encaja', 'Arrancamos. Entregas visibles cada semana, sin permanencia.', true)}
        </table>`,
      cta: { href: `${WEB}/#proceso`, label: 'Ver cómo trabajamos' },
      note: '¿Quieres añadir algo a tu solicitud? Responde a este correo y nos llega directo.',
    }),
  };
}
