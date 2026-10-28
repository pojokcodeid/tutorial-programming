export type Mode = 'csr' | 'ssr';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  emoji: string;
  description: string;
}

/**
 * Timing dasar dikirim ke App saat render server supaya markup server dan
 * render pertama client identik. Nilai renderMs/htmlBytes/totalMs baru
 * diketahui setelah renderToString selesai, jadi dimasukkan ke initial data
 * dan dibaca client setelah hydration.
 */
export interface ServerTiming {
  dataMs: number;
  renderedAt: string;
  renderMs?: number;
  htmlBytes?: number;
  totalMs?: number;
}

export interface AppProps {
  mode: Mode;
  products?: Product[];
  mismatch?: boolean;
  serverTiming?: ServerTiming;
}

export interface InitialData {
  props: AppProps;
  timing: ServerTiming;
}

export interface HydrationMeta {
  bootAt: number;
  hydratedAt: number | null;
  initialHtml: string;
  initialHtmlBytes: number;
  initialHtmlPreview: string;
}
