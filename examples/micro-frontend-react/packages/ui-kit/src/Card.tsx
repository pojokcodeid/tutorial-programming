import type { ReactNode } from 'react';

export interface CardProps {
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, footer, children, className = '' }: CardProps) {
  return (
    <section className={`tm-card ${className}`.trim()}>
      {title ? <h3 className="tm-card__title">{title}</h3> : null}
      <div className="tm-card__body">{children}</div>
      {footer ? <div className="tm-card__footer">{footer}</div> : null}
    </section>
  );
}
