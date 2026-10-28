import { useEffect, useState } from 'react';
import type { AppContext, RemoteManifest, RemoteName } from '@tokomicro/contracts';
import { Badge, Card } from '@tokomicro/ui-kit';

interface Props {
  manifest: RemoteManifest;
  ctx: AppContext;
}

interface Summary {
  events: number;
  errors: number;
  metrics: number;
  byApp: Record<string, number>;
}

const NAMES: RemoteName[] = ['header', 'products', 'cart', 'account'];

export function StatusView({ manifest, ctx }: Props) {
  const [live, setLive] = useState<RemoteManifest>(manifest);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [manifestResponse, metricsResponse] = await Promise.all([
          fetch('/api/remotes', { credentials: 'include' }),
          fetch('/api/metrics/summary', { credentials: 'include' })
        ]);
        if (!manifestResponse.ok) throw new Error(`Manifest HTTP ${manifestResponse.status}`);
        const next = (await manifestResponse.json()) as RemoteManifest;
        if (alive) setLive(next);
        if (metricsResponse.ok) {
          const metrics = (await metricsResponse.json()) as Summary;
          if (alive) setSummary(metrics);
        }
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : 'Gagal memuat status.');
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="status">
      <h1>{ctx.t('status.title')}</h1>
      <p className="status-lead">{ctx.t('status.lead')}</p>
      {error ? <p className="auth-error">{error}</p> : null}

      <div className="status-grid">
        {NAMES.map((name) => {
          const entry = live.remotes[name];
          if (!entry) return null;
          return (
            <Card
              key={name}
              title={
                <span className="status-name">
                  {name}{' '}
                  <Badge tone={entry.status === 'stable' ? 'success' : 'default'}>
                    {entry.status}
                  </Badge>
                </span>
              }
            >
              <dl className="status-list">
                <div>
                  <dt>{ctx.t('status.version')}</dt>
                  <dd>{entry.version}</dd>
                </div>
                <div>
                  <dt>{ctx.t('status.owner')}</dt>
                  <dd>{entry.owner}</dd>
                </div>
                <div>
                  <dt>{ctx.t('status.released')}</dt>
                  <dd>{new Date(entry.releasedAt).toLocaleString('id-ID')}</dd>
                </div>
              </dl>
              <code className="status-url">{entry.url}</code>
            </Card>
          );
        })}
      </div>

      <Card title="Telemetry" className="status-metrics">
        {summary ? (
          <div className="tm-row">
            <Badge>{summary.events} event</Badge>
            <Badge tone={summary.errors > 0 ? 'danger' : 'success'}>
              {summary.errors} error
            </Badge>
            <Badge>{summary.metrics} metrik</Badge>
            {Object.entries(summary.byApp).map(([app, count]) => (
              <Badge key={app}>
                {app}: {count}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="tm-muted">Belum ada data telemetri.</p>
        )}
      </Card>
    </section>
  );
}
