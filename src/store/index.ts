import { createPinia } from 'pinia';
import HTTPService from '@/common/services/HTTPService';

const pinia = createPinia();

pinia.use(({ store }) => {
    /* eslint-disable no-param-reassign */
    store.$http = new HTTPService();
    /* eslint-enable no-param-reassign */
});

export default pinia;
