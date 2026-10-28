import type { User } from '@tokomicro/contracts';
import { userSchema } from '@tokomicro/contracts';

export interface Session {
  token: string;
  expiresAt: number;
  user: User;
}

const REFRESH_WINDOW_MS = 60_000;

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function loginRequest(username: string, password: string): Promise<Session> {
  const response = await fetch('/api/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(String(data.error ?? `HTTP ${response.status}`));

  const user = userSchema.parse(data.user);
  return {
    token: String(data.token),
    expiresAt: Number(data.expiresAt),
    user
  };
}

export async function refreshSession(): Promise<Session | null> {
  const response = await fetch('/api/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  if (!response.ok) return null;

  const data = await readJson(response);
  if (!data.token) return null;

  const me = await fetch('/api/me', {
    credentials: 'include',
    headers: { Authorization: `Bearer ${String(data.token)}` }
  });
  if (!me.ok) return null;

  return {
    token: String(data.token),
    expiresAt: Number(data.expiresAt),
    user: userSchema.parse(await me.json())
  };
}

export async function logoutRequest(): Promise<void> {
  await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
}

export function isTokenFresh(session: Session | null): boolean {
  return Boolean(session && session.expiresAt - Date.now() > REFRESH_WINDOW_MS);
}
