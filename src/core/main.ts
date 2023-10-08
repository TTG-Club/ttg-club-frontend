import 'virtual:svg-icons-register';
import 'vite/modulepreload-polyfill';
import { createApp } from 'vue';
import { createVfm } from 'vue-final-modal';
import VueGtag from 'vue-gtag';
import VueLazyLoad from 'vue-lazyload';
import VueTippy from 'vue-tippy';
import Toast from 'vue-toastification';

import router from '@/core/router';
import pinia from '@/core/store';

import { useAxios } from '@/shared/compositions/useAxios';
import { TippyLazy } from '@/shared/directives/TippyLazy';
import isDev from '@/shared/helpers/isDev';

import App from './App.vue';
import registerComponents from './configs/RegisterComponents';
import { TippyOptions } from './configs/TippyConfig';
import { ToastEventBus, ToastOptions } from './configs/ToastConfig';

import 'vue-final-modal/style.css';
import '@/assets/styles/index.scss';

const app = createApp(App);
const vfm = createVfm();

app.config.globalProperties.$http = useAxios();

app
  .use(pinia)
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
  app.use(VueGtag, { config: { id: import.meta.env.VITE_GTAG_ID } });
}

registerComponents(app);

app.mount('#dnd5club');
