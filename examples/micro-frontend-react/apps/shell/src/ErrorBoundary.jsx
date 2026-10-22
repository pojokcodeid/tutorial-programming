import { Component } from 'react';

/**
 * Error boundary per remote.
 *
 * Menangkap dua jenis kegagalan: remote gagal diunduh (import() ditolak) dan
 * remote melempar galat saat merender. Slot itu saja yang berganti isi —
 * header, navigasi, dan remote lain tetap hidup.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[shell] remote "${this.props.name}" gagal:`, error, info?.componentStack);
  }

  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}
