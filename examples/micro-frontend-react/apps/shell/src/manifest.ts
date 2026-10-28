import {
  remoteManifestSchema,
  type RemoteManifest,
  type RemoteName
} from '@tokomicro/contracts';

const PORTS: Record<RemoteName, number> = {
  header: 4174,
  products: 4175,
  cart: 4176,
  account: 4177
};

const OWNERS: Record<RemoteName, string> = {
  header: 'Tim Chrome',
  products: 'Tim Katalog',
  cart: 'Tim Transaksi',
  account: 'Tim Akun'
};

function baseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost';
  return `${window.location.protocol}//${window.location.hostname}`;
}

export function createDefaultManifest(): RemoteManifest {
  const base = baseUrl();
  const remotes = Object.fromEntries(
    (Object.keys(PORTS) as RemoteName[]).map((name) => [
      name,
      {
        version: '1.0.0',
        url: `${base}:${PORTS[name]}/assets/remoteEntry.js`,
        owner: OWNERS[name],
        status: 'stable' as const,
        releasedAt: new Date().toISOString()
      }
    ])
  ) as RemoteManifest['remotes'];

  return { generatedAt: new Date().toISOString(), remotes };
}

export async function fetchManifest(): Promise<RemoteManifest> {
  const response = await fetch('/api/remotes', { credentials: 'include' });
  if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
  return remoteManifestSchema.parse(await response.json());
}

export async function fetchFlags(): Promise<Record<string, boolean>> {
  const response = await fetch('/api/flags', { credentials: 'include' });
  if (!response.ok) return { newCheckout: true, accountRemote: true, legacyCatalog: true };
  const data = (await response.json()) as { flags?: Record<string, boolean> };
  return data.flags ?? {};
}
