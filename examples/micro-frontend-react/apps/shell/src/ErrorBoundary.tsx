import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  name: string;
  fallback: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Error boundary per remote.
 *
 * Menangkap dua jenis kegagalan: remote gagal diunduh (import() ditolak) dan
 * remote melempar galat saat merender. Hanya slot itu yang berganti isi.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[shell] remote "${this.props.name}" gagal:`, error, info.componentStack);
    this.props.onError?.(error, info);
  }

  render(): ReactNode {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}
