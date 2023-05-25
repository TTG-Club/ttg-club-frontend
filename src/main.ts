import 'vite/modulepreload-polyfill';
import 'virtual:svg-icons-register';
import { createApp } from 'vue';
import VueTippy from 'vue-tippy';
import VueLazyLoad from 'vue-lazyload';
import Toast from 'vue-toastification';
import { createVfm } from 'vue-final-modal';
import VueGtag from 'vue-gtag';
import registerComponents from '@/common/utils/RegisterComponents';
import HTTPService from '@/common/services/HTTPService';
import { TippyOptions } from '@/common/utils/TippyConfig';
import { ToastEventBus, ToastOptions } from '@/common/utils/ToastConfig';
import isDev from '@/common/helpers/isDev';
import App from '@/App.vue';
import pinia from '@/store';
import router from './router';
import 'vue-final-modal/style.css';
import '@/assets/styles/index.scss';
import { TippyLazy } from '@/common/directives/TippyLazy';

const app = createApp(App);
const vfm = createVfm();

app.config.globalProperties.$http = new HTTPService();

app.use(pinia)
  .use(router)
  .use(VueTippy, TippyOptions)
  .use(VueLazyLoad)
  .use(Toast, {
    ...ToastOptions,
    eventBus: ToastEventBus
  })
  .use(vfm)
  .directive('tippy-lazy', TippyLazy);

if (!isDev) {
  app.use(VueGtag, {
    config: {
      // @ts-ignore
      id: window.GTAG_ID
    }
  });
}

registerComponents(app);

app.mount('#dnd5club');
