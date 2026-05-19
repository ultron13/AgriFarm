import { logger } from './logger';

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@farmconnect.co.za';
const FROM_NAME  = process.env.SENDGRID_FROM_NAME  ?? 'FarmConnect SA';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    content: string; // base64
    filename: string;
    type: string;
    disposition: 'attachment';
  }>;
}

// Uses the SendGrid HTTP API directly so it works in both Node.js and CF Workers.
export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const key = process.env.SENDGRID_API_KEY ?? '';
  if (!key) {
    logger.warn({ to: opts.to, subject: opts.subject }, 'SendGrid not configured — skipping email');
    return;
  }

  const body = {
    personalizations: [{ to: [{ email: opts.to }] }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: opts.subject,
    content: [
      ...(opts.text ? [{ type: 'text/plain', value: opts.text }] : []),
      { type: 'text/html', value: opts.html },
    ],
    ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`SendGrid ${res.status}: ${detail}`);
  }
}

// ── Branded HTML wrapper ──────────────────────────────────────────────────────

function wrap(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#111827;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1a6b45;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">FarmConnect SA</h1>
    <p style="color:#a7f3d0;margin:4px 0 0;font-size:13px">Direct from Limpopo farms · farmconnect.co.za</p>
  </div>
  <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    ${body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="font-size:12px;color:#9ca3af;margin:0">FarmConnect SA (Pty) Ltd · support@farmconnect.co.za</p>
  </div>
</body></html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:14px">${label}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:600">${value}</td>
  </tr>`;
}

export function invoiceEmail(opts: {
  invoiceNumber: string;
  orderNumber: string;
  amount: string;
  dueDate: string;
  pdfUrl?: string;
}): { subject: string; html: string } {
  const subject = `Invoice ${opts.invoiceNumber} — FarmConnect SA`;
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px">Your invoice is ready</h2>
    <table style="width:100%;border-collapse:collapse">
      ${row('Invoice', opts.invoiceNumber)}
      ${row('Order', opts.orderNumber)}
      ${row('Amount due', `<span style="color:#1a6b45">${opts.amount}</span>`)}
      ${row('Due date', opts.dueDate)}
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280">
      The PDF invoice is attached to this email.
      ${opts.pdfUrl ? `You can also <a href="${opts.pdfUrl}" style="color:#1a6b45">view it online</a>.` : ''}
    </p>
  `);
  return { subject, html };
}

export function notificationEmail(templateId: string, variables: Record<string, string>): { subject: string; html: string } {
  const SUBJECTS: Record<string, string> = {
    order_confirmed:   'Your FarmConnect order is confirmed',
    order_received:    'New order for your produce — FarmConnect',
    payout_processed:  'Your FarmConnect payout has been processed',
  };
  const subject = SUBJECTS[templateId] ?? 'FarmConnect notification';

  const rows = Object.entries(variables)
    .map(([k, v]) => row(k.replace(/_/g, ' '), v))
    .join('');

  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px">${subject}</h2>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
  `);
  return { subject, html };
}
