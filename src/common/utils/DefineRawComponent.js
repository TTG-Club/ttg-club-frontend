import { defineComponent } from 'vue';
import HTTPService from '@/common/services/HTTPService';

const http = new HTTPService();

async function defineRawComponent(template, url) {
    if (!template && !url) {
        throw new Error('URL and template is not defined');
    }

    try {
        let html = template;

        if (!html && !template) {
            const { data } = await http.rawGet(url);

            html = data;
        }

        return defineComponent({
            // eslint-disable-next-line vue/match-component-file-name
            name: 'RawContent',
            template: html
        });
    } catch (err) {
        return err;
    }
}

export default defineRawComponent;
