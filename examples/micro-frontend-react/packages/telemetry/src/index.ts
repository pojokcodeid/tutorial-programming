import type { Telemetry } from '@tokomicro/contracts';

interface Options {
  app: string;
  endpoint?: string;
  enabled?: boolean;
}

interface Envelope {
  app: string;
  type: 'event' | 'error' | 'metric';
  name: string;
  value?: number;
  payload?: Record<string, unknown>;
  at: string;
}

function send(endpoint: string, envelope: Envelope): void {
  const body = JSON.stringify(envelope);

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
  } catch {
    /* sendBeacon bisa diblokir; lanjut ke fetch. */
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch(() => {
    /* Telemetri tidak boleh menjatuhkan aplikasi. */
  });
}

/**
 * Telemetry sederhana yang bisa dipakai shell maupun remote.
 * Di produksi, implementasi ini bisa diganti adapter Sentry/OpenTelemetry
 * tanpa mengubah kontrak `ctx.telemetry`.
 */
export function createTelemetry({
  app,
  endpoint = '/api/telemetry',
  enabled = true
}: Options): Telemetry {
  const emit = (envelope: Omit<Envelope, 'app' | 'at'>) => {
    if (!enabled) return;
    send(endpoint, { ...envelope, app, at: new Date().toISOString() });
  };

  return {
    event(name, payload) {
      emit({ type: 'event', name, payload });
    },
    error(error, meta) {
      emit({
        type: 'error',
        name: error instanceof Error ? error.name : 'UnknownError',
        payload: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          ...meta
        }
      });
    },
    metric(name, value, meta) {
      emit({ type: 'metric', name, value, payload: meta });
    }
  };
}
