import type { HydrationMeta, InitialData } from './types';

declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData;
    __HYDRATION_ERRORS__?: string[];
    __HYDRATION_META__?: HydrationMeta;
  }
}

export {};
