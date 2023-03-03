declare module '*.vue' {
    import { defineComponent } from 'vue';

    const Component: ReturnType<typeof defineComponent>;
    export default Component;
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
    }
}
