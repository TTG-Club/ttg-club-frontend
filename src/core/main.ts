import 'virtual:svg-icons-register';
import 'vite/modulepreload-polyfill';
import { createApp } from 'vue';
import { createVfm } from 'vue-final-modal';
import VueGtag from 'vue-gtag';
import VueLazyLoad from 'vue-lazyload';
import VueTippy from 'vue-tippy';
import Toast from 'vue-toastification';

import { httpClient } from '@/shared/api';
import { TippyLazy } from '@/shared/directives/TippyLazy';
import isDev from '@/shared/utils/isDev';

import App from './App.vue';
import { TippyOptions } from './configs/TippyConfig';
import { ToastEventBus, ToastOptions } from './configs/ToastConfig';
import router from './router';
import pinia from './store';
import registerComponents from './utils/RegisterComponents';

import 'vue-final-modal/style.css';
import '@/assets/styles/index.scss';

const app = createApp(App);
const vfm = createVfm();

app.config.globalProperties.$http = httpClient;

app
  .use(pinia)
  .use(router)
  .use(VueTippy, TippyOptions)
  .use(VueLazyLoad)
  .use(Toast, {
    ...ToastOptions,
    eventBus: ToastEventBus,
  })
  .use(vfm)
  .directive('tippy-lazy', TippyLazy);

if (!isDev) {
  app.use(VueGtag, { config: { id: import.meta.env.VITE_GTAG_ID } });
}

registerComponents(app);

app.mount('#dnd5club');
