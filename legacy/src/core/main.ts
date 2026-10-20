import 'virtual:svg-icons-register';
import 'vite/modulepreload-polyfill';
import VueGtag from 'vue-gtag';
import VueLazyLoad from 'vue-lazyload';
import VueTippy from 'vue-tippy';
import Toast from 'vue-toastification';

import { httpClient } from '@/shared/api';
import { TippyOptions, ToastEventBus, ToastOptions } from '@/shared/config';
import { TippyLazy } from '@/shared/directives/TippyLazy';
import isDev from '@/shared/utils/isDev';

import App from './App.vue';
import router from './router';
import pinia from './store';
import registerComponents from './utils/RegisterComponents';

import '@/assets/styles/index.scss';

const app = createApp(App);

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
  .directive('tippy-lazy', TippyLazy);

if (!isDev) {
  app.use(VueGtag, { config: { id: import.meta.env.VITE_GTAG_ID } });
}

registerComponents(app);

app.mount('#dnd5club');
