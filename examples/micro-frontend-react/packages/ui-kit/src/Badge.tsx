import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  tone?: 'default' | 'solid' | 'success' | 'danger';
  label?: string;
}

export function Badge({ children, tone = 'default', label }: BadgeProps) {
  const classes = ['tm-badge', tone !== 'default' ? `tm-badge--${tone}` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} aria-label={label}>
      {children}
    </span>
  );
}
