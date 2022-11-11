import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueEasyLightbox from 'vue-easy-lightbox';
import VueTippy from 'vue-tippy';
import VueLazyload from 'vue-lazyload';
import Toast from 'vue-toastification';
import vfmPlugin from 'vue-final-modal';
import isDev from '@/common/helpers/isDev';
import registerComponents from '@/common/utils/RegisterComponents';
import HTTPService from '@/common/services/HTTPService';
import VueTippyConfig from '@/common/utils/VueTippyConfig';
import { ToastEventBus, ToastOptions } from '@/common/utils/ToastConfig';
import App from '@/App.vue';
import router from './router';
import '@/assets/styles/index.scss';

const app = createApp(App);

app.config.globalProperties.$http = new HTTPService();

const pinia = createPinia();

pinia.use(({ store }) => {
    /* eslint-disable no-param-reassign */
    store.$http = new HTTPService();
    store.$isDev = isDev;
    /* eslint-enable no-param-reassign */
});

app.use(pinia)
    .use(router)
    .use(VueEasyLightbox)
    .use(VueTippy, VueTippyConfig)
    .use(VueLazyload, {
        preLoad: 1.7
    })
    .use(Toast, {
        ...ToastOptions,
        eventBus: ToastEventBus
    })
    .use(vfmPlugin, {
        key: '$vfm',
        componentName: 'VueFinalModal',
        dynamicContainerName: 'ModalsContainer'
    });

registerComponents(app);

app.mount('#dnd5club');
