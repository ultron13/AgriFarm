/**
 * Cloudflare Workers entry point.
 *
 * Handles two exports:
 *   fetch  — HTTP requests via a manual Express bridge (runExpressInCF)
 *   queue  — CF Queue batch consumer for payouts, notifications, invoices
 *
 * Local development still uses src/server.ts + src/worker.ts with BullMQ.
 *
 * Why not createServerAdapter?  That adapter wraps FETCH handlers to work in Node.js.
 * Express is a Node.js handler; passing it to createServerAdapter and calling handler.fetch()
 * sends the raw CF Request object as Express's `req` and the CF env as `res`, which breaks
 * every middleware.  The manual bridge below constructs proper IncomingMessage / ServerResponse
 * mocks and resolves to a native CF Response.
 */
import { Readable } from 'node:stream';
import { createApp } from './app';
import { initCFQueues } from './jobs/queues';
import { processPayoutJob } from './jobs/payout.job';
import { processNotificationJob } from './jobs/notification.job';
import { processInvoiceJob } from './jobs/invoice.job';
import type { PayoutJobData, NotificationJobData, InvoiceJobData } from './jobs/queues';

interface CFEnv {
  PAYOUTS_QUEUE: { send(body: unknown, opts?: { delaySeconds?: number }): Promise<void> };
  NOTIFICATIONS_QUEUE: { send(body: unknown): Promise<void> };
  INVOICES_QUEUE: { send(body: unknown): Promise<void> };
  [key: string]: unknown;
}

const app = createApp();

async function runExpressInCF(cfRequest: Request): Promise<Response> {
  const url = new URL(cfRequest.url);
  const bodyBuffer = cfRequest.body ? Buffer.from(await cfRequest.arrayBuffer()) : null;

  const reqHeaders: Record<string, string> = {};
  cfRequest.headers.forEach((v, k) => { reqHeaders[k] = v; });

  return new Promise<Response>((resolve) => {
    // Build a Readable that Express body-parser can consume.
    const nodeReq = Object.assign(new Readable({ read() {} }), {
      method: cfRequest.method,
      url: url.pathname + url.search,
      headers: reqHeaders,
      socket: { remoteAddress: cfRequest.headers.get('cf-connecting-ip') ?? '127.0.0.1', encrypted: true },
      connection: { remoteAddress: cfRequest.headers.get('cf-connecting-ip') ?? '127.0.0.1' },
      ip: cfRequest.headers.get('cf-connecting-ip') ?? '127.0.0.1',
    });
    if (bodyBuffer?.length) nodeReq.push(bodyBuffer);
    nodeReq.push(null); // signal EOF

    let status = 200;
    let statusMessage = 'OK';
    const resHeaders: Record<string, string | string[]> = {};
    const chunks: Buffer[] = [];
    let resolved = false;

    function finish(chunk?: unknown) {
      if (resolved) return;
      resolved = true;
      if (chunk) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk as Buffer);
      const body = chunks.length ? Buffer.concat(chunks) : null;
      const headers = new Headers();
      for (const [k, v] of Object.entries(resHeaders)) {
        if (Array.isArray(v)) v.forEach(x => headers.append(k, x));
        else headers.set(k, v);
      }
      resolve(new Response(body, { status, headers }));
    }

    const nodeRes: Record<string, unknown> = {
      get statusCode() { return status; },
      set statusCode(v: number) { status = v; },
      get statusMessage() { return statusMessage; },
      set statusMessage(v: string) { statusMessage = v; },
      setHeader(k: string, v: string | string[]) { resHeaders[k.toLowerCase()] = v; },
      getHeader(k: string) { return resHeaders[k.toLowerCase()]; },
      getHeaders() { return resHeaders; },
      removeHeader(k: string) { delete resHeaders[k.toLowerCase()]; },
      hasHeader(k: string) { return (k.toLowerCase() in resHeaders); },
      write(chunk: unknown, _enc?: unknown, cb?: () => void) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk as Buffer);
        if (typeof _enc === 'function') (_enc as () => void)();
        else cb?.();
        return true;
      },
      end(chunk?: unknown, _enc?: unknown, cb?: () => void) {
        finish(chunk);
        if (typeof _enc === 'function') (_enc as () => void)();
        else cb?.();
      },
      once(_ev: string, _cb: () => void) { return nodeRes; },
      on(_ev: string, _cb: () => void) { return nodeRes; },
      off(_ev: string, _cb: () => void) { return nodeRes; },
      removeListener(_ev: string, _cb: () => void) { return nodeRes; },
      emit() { return false; },
      writableEnded: false,
      closed: false,
      destroyed: false,
      finished: false,
      locals: {},
    };

    app(nodeReq as any, nodeRes as any, () => {
      // Express called next() without sending a response → 404
      if (!resolved) finish();
    });
  });
}

export default {
  async fetch(request: Request, env: CFEnv, ctx: ExecutionContext): Promise<Response> {
    try {
      // Copy all string-valued CF env bindings (secrets + vars) into process.env so that
      // module-level code that reads process.env.XXX works without changing every module.
      // This runs once per isolate startup; non-string bindings (queues) are skipped.
      for (const [k, v] of Object.entries(env)) {
        if (typeof v === 'string') process.env[k] = v;
      }
      initCFQueues(env);
      return await runExpressInCF(request);
    } catch (err) {
      console.error('Worker unhandled error:', err);
      return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  async queue(batch: MessageBatch<unknown>, env: CFEnv): Promise<void> {
    initCFQueues(env);
    for (const msg of batch.messages) {
      try {
        const body = msg.body as Record<string, unknown>;
        if (batch.queue === 'farmconnect-payouts') {
          await processPayoutJob(body as unknown as PayoutJobData);
        } else if (batch.queue === 'farmconnect-notifications') {
          await processNotificationJob(body as unknown as NotificationJobData);
        } else if (batch.queue === 'farmconnect-invoices') {
          await processInvoiceJob(body as unknown as InvoiceJobData);
        }
        msg.ack();
      } catch (err) {
        console.error('Queue job failed, retrying', { queue: batch.queue, err });
        msg.retry();
      }
    }
  },
};
