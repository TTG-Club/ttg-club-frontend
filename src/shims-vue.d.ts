declare module '*.vue' {
  import { defineComponent } from 'vue';

  const Component: ReturnType<typeof defineComponent>;
  export default Component;
}

interface ImportMetaEnv {
  readonly VUE_APP_API_URL: string;
  readonly VUE_APP_DEV: 'true' | 'false';
  readonly VUE_APP_BUILD_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly VUE_APP_API_URL: string;
      readonly VUE_APP_DEV: 'true' | 'false';
      readonly VUE_APP_BUILD_PATH: string;
    }
  }

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
