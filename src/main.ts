import { createApp } from 'vue';
import VueTippy from 'vue-tippy';
import VueLazyLoad from 'vue-lazyload';
import Toast from 'vue-toastification';
import { vfmPlugin } from 'vue-final-modal';
import VueGtag from 'vue-gtag';
import { initYandexMetrika } from 'yandex-metrika-vue3';
import registerComponents from '@/common/utils/RegisterComponents';
import HTTPService from '@/common/services/HTTPService';
import { TippyOptions } from '@/common/utils/TippyConfig';
import { ToastEventBus, ToastOptions } from '@/common/utils/ToastConfig';
import isDev from '@/common/helpers/isDev';
import App from '@/App.vue';
import pinia from '@/store';
import router from './router';
import '@/assets/styles/index.scss';

const app = createApp(App);

app.config.globalProperties.$http = new HTTPService();

app.use(pinia)
    .use(router)
    .use(VueTippy, TippyOptions)
    .use(VueLazyLoad)
    .use(Toast, {
        ...ToastOptions,
        eventBus: ToastEventBus
    })
    .use(vfmPlugin({
        key: '$vfm',
        componentName: 'VueFinalModal',
        dynamicContainerName: 'ModalsContainer'
    }));

// @ts-ignore
if (!isDev && window.GTAG_ID) {
    app.use(VueGtag, {
        config: {
            // @ts-ignore
            id: String(window.GTAG_ID)
        }
    });
}

// @ts-ignore
if (isDev && window.YM_ID) {
    app.use(initYandexMetrika, {
        // @ts-ignore
        id: String(window.YM_ID),
        env: 'production',
        scriptSrc: 'https://mc.yandex.ru/metrika/tag.js'
    });
}

registerComponents(app);

app.mount('#dnd5club');
