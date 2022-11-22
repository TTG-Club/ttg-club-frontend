export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            readonly VUE_APP_API_URL: string;
            readonly VUE_APP_DEV: 'true' | 'false';
            readonly VUE_APP_BUILD_PATH: string;
            readonly BUILD_TARGET?: 'serve';
        }
    }
}
