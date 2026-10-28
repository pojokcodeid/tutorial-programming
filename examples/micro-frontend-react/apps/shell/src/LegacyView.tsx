import type { AppContext } from '@tokomicro/contracts';
import { Button } from '@tokomicro/ui-kit';

const LEGACY_URL = import.meta.env.VITE_LEGACY_URL ?? 'http://localhost:4178';

interface Props {
  ctx: AppContext;
}

export function LegacyView({ ctx }: Props) {
  return (
    <section className="legacy">
      <h1>{ctx.t('legacy.title')}</h1>
      <p className="legacy-lead">{ctx.t('legacy.lead')}</p>
      <div className="legacy-actions">
        <Button variant="primary" onClick={() => ctx.navigate('/katalog')}>
          Buka katalog baru
        </Button>
        <a href={LEGACY_URL} target="_blank" rel="noreferrer">
          Buka aplikasi lama di tab baru
        </a>
      </div>
      <iframe
        className="legacy-frame"
        title="Aplikasi katalog lama"
        src={LEGACY_URL}
        loading="lazy"
      />
    </section>
  );
}
