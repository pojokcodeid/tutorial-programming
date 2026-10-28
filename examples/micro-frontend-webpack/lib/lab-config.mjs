/**
 * Konstanta bersama untuk konfigurasi Webpack, Rspack, server, dan test.
 * Semua nilai port/URL ditulis sekali agar tidak ada angka yang tersebar.
 */
export const HOST_PORT = 4181;
export const REMOTE_PORT = 4182;

export const REMOTE_NAME = 'remote';
export const REMOTE_ENTRY_URL = `http://localhost:${REMOTE_PORT}/remoteEntry.js`;
export const HOST_ORIGIN = `http://localhost:${HOST_PORT}`;
export const REMOTE_ORIGIN = `http://localhost:${REMOTE_PORT}`;

/**
 * Format yang dipakai ModuleFederationPlugin:
 *   namaContainer@URL-remoteEntry
 */
export function federationRemote(name = REMOTE_NAME, entryUrl = REMOTE_ENTRY_URL) {
  return `${name}@${entryUrl}`;
}

/**
 * Validasi kecil untuk format remote Module Federation.
 * Mengembalikan objek { name, url, entry } atau melempar Error.
 */
export function parseRemoteUrl(value) {
  if (typeof value !== 'string') {
    throw new TypeError('remote harus berupa string');
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('remote tidak boleh kosong');
  }

  const separator = trimmed.indexOf('@');
  if (separator <= 0 || separator === trimmed.length - 1) {
    throw new Error(
      `format remote tidak valid: "${value}" (contoh: remote@http://localhost:4182/remoteEntry.js)`
    );
  }

  const name = trimmed.slice(0, separator);
  const rawUrl = trimmed.slice(separator + 1);

  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
    throw new Error(`nama remote tidak valid: "${name}" (harus identifier JavaScript)`);
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`URL remote tidak valid: "${rawUrl}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL remote harus memakai http atau https');
  }

  if (!parsed.pathname.endsWith('.js')) {
    throw new Error('URL remote harus menunjuk ke berkas .js (biasanya remoteEntry.js)');
  }

  return { name, url: parsed.toString(), entry: trimmed };
}
