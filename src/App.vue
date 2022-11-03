<script>
    import { useUIStore } from '@/store/UI/UIStore';
    import { useUserStore } from "@/store/UI/UserStore";

    export default {
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

                this.uiStore.setTheme({
                    name: this.uiStore.getCookieTheme(),
                    avoidHtmlUpdate: ['theme-light', 'theme-dark'].includes(html?.dataset?.theme)
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
    };
</script>
