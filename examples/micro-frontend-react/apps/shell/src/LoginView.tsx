import { useState, type FormEvent } from 'react';
import type { AppContext } from '@tokomicro/contracts';
import { Button } from '@tokomicro/ui-kit';

interface Props {
  ctx: AppContext;
}

function nextPath(raw: string | null): string {
  if (!raw) return '/katalog';
  if (raw.startsWith('/')) return raw;
  return `/${raw}`;
}

export function LoginView({ ctx }: Props) {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo123');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await ctx.login(username, password);
      ctx.toast(`${ctx.t('header.hello', { name: user.name })}`, 'success');
      ctx.navigate(nextPath(ctx.params.get('next')), { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal masuk.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth">
      <div className="auth-card">
        <h1>{ctx.t('login.title')}</h1>
        <p className="auth-lead">{ctx.t('login.lead')}</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-field">
            <span>{ctx.t('login.username')}</span>
            <input
              name="username"
              value={username}
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>{ctx.t('login.password')}</span>
            <input
              name="password"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="primary" loading={busy}>
            {busy ? ctx.t('login.busy') : ctx.t('login.submit')}
          </Button>
        </form>

        <p className="auth-note">{ctx.t('login.note')}</p>
      </div>
    </section>
  );
}
