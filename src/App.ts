import { defineComponent } from 'vue';
import { useUIStore } from '@/store/UI/UIStore';
import { useUserStore } from '@/store/UI/UserStore';

export default defineComponent({
    data: () => ({
        uiStore: useUIStore(),
        userStore: useUserStore()
    }),
    async beforeMount() {
        await this.initUser();
    },
    async mounted() {
        await this.initWindowSize();
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

        async initWindowSize() {
            this.uiStore.watchWindowSize();

            await this.uiStore.setFullscreenState(false);
        },

        async initUser() {
            try {
                if (await this.userStore.getUserStatus()) {
                    await this.userStore.getUserInfo();
                }
            } catch (err) {
                this.userStore.clearUser();
            }
        }
    }
});
