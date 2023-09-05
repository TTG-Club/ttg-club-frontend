import 'virtual:svg-icons-register';
import 'vite/modulepreload-polyfill';
import { createApp } from 'vue';
import { createVfm } from 'vue-final-modal';
import 'vue-final-modal/style.css';
import VueGtag from 'vue-gtag';
import VueLazyLoad from 'vue-lazyload';
import VueTippy from 'vue-tippy';
import Toast from 'vue-toastification';

import { useAxios } from '@/shared/composition/useAxios';
import { TippyLazy } from '@/shared/directives/TippyLazy';
import isDev from '@/shared/helpers/isDev';
import registerComponents from '@/shared/utils/RegisterComponents';
import { TippyOptions } from '@/shared/utils/TippyConfig';
import { ToastEventBus, ToastOptions } from '@/shared/utils/ToastConfig';

import router from './router';

import App from '@/App.vue';
import '@/assets/styles/index.scss';
import pinia from '@/store';

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
