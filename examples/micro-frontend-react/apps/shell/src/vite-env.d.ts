/// <reference types="vite/client" />
/// <reference path="../../../packages/contracts/src/remotes.d.ts" />

interface ImportMetaEnv {
  readonly VITE_LEGACY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
