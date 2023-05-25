declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const Component: DefineComponent;
  export default Component;
}

interface ImportMetaEnv {
  readonly VITE_APP_API_URL: string;
  readonly VITE_APP_DEV: 'true' | 'false';
  readonly VITE_APP_BUILD_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    GTAG_ID: string;
    YM_ID: string;
  }
}

declare module 'vue-virtual-scroller' {
  import type { DefineComponent } from 'vue';

  export const DynamicScroller: DefineComponent;
  export const DynamicScrollerItem: DefineComponent;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module 'tippy' {
  import type { TippyComponent } from 'vue-tippy';

  export const Tippy: TippyComponent;
}
