import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Kalau remote mati atau remoteEntry.js 404, React.lazy akan melempar error.
 * Error boundary membuat host tetap tampil, bukan halaman putih.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[host] remote gagal dimuat:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="remote-error" role="alert">
          <h2>Remote tidak bisa dimuat</h2>
          <p>{this.state.error.message}</p>
          <p>
            Pastikan <code>apps/remote/dist/remoteEntry.js</code> sudah dibangun
            dan server port 4182 hidup. Lihat bagian <strong>Troubleshooting</strong>{' '}
            di README.
          </p>
          <button type="button" onClick={() => this.setState({ error: null })}>
            Coba lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
