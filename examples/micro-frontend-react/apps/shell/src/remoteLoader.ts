import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { RemoteAppProps, RemoteManifest, RemoteName } from '@tokomicro/contracts';
import {
  __federation_method_getRemote,
  __federation_method_setRemote,
  __federation_method_unwrapDefault
} from 'virtual:__federation__';

/**
 * Fallback build-time. Dipakai bila manifest belum tersedia atau gagal dimuat.
 * Saat manifest tersedia, URL remote diganti lewat API runtime plugin federasi.
 */
const fallbackLoaders: Record<RemoteName, () => Promise<unknown>> = {
  header: () => import('header/App'),
  products: () => import('products/App'),
  cart: () => import('cart/App'),
  account: () => import('account/App')
};

export interface RemoteLoadInfo {
  name: RemoteName;
  ms: number;
}

export function createRemoteComponent(
  name: RemoteName,
  label: string,
  manifestRef: { current: RemoteManifest | null },
  onLoaded?: (info: RemoteLoadInfo) => void
): LazyExoticComponent<ComponentType<RemoteAppProps>> {
  return lazy(async () => {
    const started = performance.now();
    const url = manifestRef.current?.remotes[name]?.url;
    let module: unknown;

    if (url) {
      __federation_method_setRemote(name, {
        url: () => Promise.resolve(url),
        format: 'esm',
        from: 'vite'
      });
      module = await __federation_method_getRemote(name, './App');
    } else {
      module = await fallbackLoaders[name]();
    }

    const Component = __federation_method_unwrapDefault(module) as ComponentType<RemoteAppProps>;
    const ms = performance.now() - started;

    console.info(`[shell] remote "${label}" siap dalam ${ms.toFixed(0)} ms`);
    onLoaded?.({ name, ms });

    return { default: Component };
  });
}
