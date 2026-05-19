// Thin wrapper so errorHandler can call captureException without
// hard-importing @sentry/node (which would break CF Worker bundling).
// server.ts and worker.ts call registerCapture() after initialising Sentry.

type CaptureFn = (err: unknown) => void;
let _capture: CaptureFn | null = null;

export function registerCapture(fn: CaptureFn): void {
  _capture = fn;
}

export function captureException(err: unknown): void {
  _capture?.(err);
}
