import type { TippyPluginOptions } from 'vue-tippy';
import HTTPService from '@/common/services/HTTPService';
import errorHandler from '@/common/helpers/errorHandler';

const options: TippyPluginOptions = {
    defaultProps: {
        allowHTML: true,
        interactive: true,
        hideOnClick: false,
        sticky: true,
        touch: false,
        theme: 'dnd5club',
        strategy: 'fixed',
        maxWidth: 450,

        // @ts-ignore
        delay: [450, null],
        interactiveBorder: 7,
        appendTo: () => document.body,
        onClickOutside() {
            return false;
        },

        // @ts-ignore
        onShow(instance) {
            const ref = instance.reference;
            const attr = ref.getAttribute('data-tippy-url');

            let canShow = false;

            if (attr) {
                canShow = true;
            }

            if (instance.props.content) {
                canShow = true;
            }

            if (!canShow) {
                return canShow;
            }

            const http = new HTTPService();

            if (attr) {
                http.rawGet(attr)
                    .then(res => {
                        if (res.status !== 200) {
                            errorHandler(res.statusText);

                            canShow = false;
                        }

                        instance.setContent(res.data);

                        canShow = true;
                    })
                    .catch(err => {
                        errorHandler(err);

                        canShow = false;
                    });
            }

            return canShow;
        }
    }
};

export default options;
