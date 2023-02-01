import { defineComponent } from 'vue';
import UAParser from 'ua-parser-js';
import { useUIStore } from '@/store/UI/UIStore';
import { useUserStore } from '@/store/UI/UserStore';

export default defineComponent({
    data: () => ({
        uiStore: useUIStore(),
        userStore: useUserStore()
    }),
    computed: {
        isAppleDevice() {
            const ua = new UAParser();
            const device = ua.getDevice();

            return device.vendor === 'Apple';
        }
    },
    async beforeMount() {
        await this.initUser();
    },
    async mounted() {
        await this.initTheme();
    },
    methods: {
        async initTheme() {
            await this.uiStore.removeOldTheme();

            const html = document.querySelector('html');

            let avoidHtmlUpdate = false;

            if (html?.dataset?.theme) {
                avoidHtmlUpdate = ['theme-light', 'theme-dark'].includes(html?.dataset?.theme);
            }

            this.uiStore.setTheme({
                name: this.uiStore.getCookieTheme(),
                avoidHtmlUpdate
            });
        },

        async initUser() {
            try {
                if (await this.userStore.getUserStatus()) {
                    await this.userStore.getUserInfo();
                }
            } catch (err) {
                this.userStore.clearUser();
            }
        },

        openSearchModal() {
            document.dispatchEvent(new Event('open-search'));
        }
    }
});
