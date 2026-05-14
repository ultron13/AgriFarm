import { logger } from './logger';

const API_KEY = process.env.CLICKATELL_API_KEY ?? '';
const WHATSAPP_NUMBER = process.env.CLICKATELL_WHATSAPP_NUMBER ?? '';
const BASE_URL = 'https://platform.clickatell.com';

interface WhatsappMessage {
  to: string;
  templateId: string;
  variables: Record<string, string>;
}

interface SmsMessage {
  to: string;
  text: string;
}

export async function sendWhatsapp(msg: WhatsappMessage): Promise<void> {
  if (!API_KEY) {
    logger.warn('Clickatell API key not configured — skipping WhatsApp send');
    return;
  }
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      messages: [{ channel: 'whatsapp', to: msg.to, from: WHATSAPP_NUMBER, template: { name: msg.templateId, variables: msg.variables } }],
    }),
  });
  if (!res.ok) {
    logger.error({ status: res.status, to: msg.to }, 'WhatsApp send failed');
  }
}

export async function sendSms(msg: SmsMessage): Promise<void> {
  if (!API_KEY) {
    logger.warn('Clickatell API key not configured — skipping SMS send');
    return;
  }
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ messages: [{ channel: 'sms', to: msg.to, content: msg.text }] }),
  });
  if (!res.ok) {
    logger.error({ status: res.status, to: msg.to }, 'SMS send failed');
  }
}
