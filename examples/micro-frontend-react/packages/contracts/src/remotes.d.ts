/**
 * Deklarasi tipe untuk modul yang diekspos remote.
 *
 * Di proyek besar, berkas ini bisa dihasilkan dari build remote. Untuk contoh
 * ini deklarasi ditulis manual supaya kontraknya terlihat jelas dan stabil.
 */
declare module 'header/App' {
  import type { ComponentType } from 'react';
  import type { RemoteAppProps } from './index';
  const App: ComponentType<RemoteAppProps>;
  export default App;
}

declare module 'products/App' {
  import type { ComponentType } from 'react';
  import type { RemoteAppProps } from './index';
  const App: ComponentType<RemoteAppProps>;
  export default App;
}

declare module 'cart/App' {
  import type { ComponentType } from 'react';
  import type { RemoteAppProps } from './index';
  const App: ComponentType<RemoteAppProps>;
  export default App;
}

declare module 'account/App' {
  import type { ComponentType } from 'react';
  import type { RemoteAppProps } from './index';
  const App: ComponentType<RemoteAppProps>;
  export default App;
}

/**
 * Modul virtual yang disediakan @originjs/vite-plugin-federation.
 * Dipakai untuk mengganti URL remote saat runtime dari manifest.
 */
declare module 'virtual:__federation__' {
  interface RemoteConfig {
    url: string | (() => Promise<string>);
    format: 'esm' | 'systemjs' | 'var';
    from: 'vite' | 'webpack';
  }

  export function __federation_method_setRemote(name: string, config: RemoteConfig): void;
  export function __federation_method_getRemote(name: string, expose: string): Promise<unknown>;
  export function __federation_method_unwrapDefault(module: unknown): unknown;
}
