<template>
    <nav-bar />

    <div
        id="container"
        class="container"
    >
        <router-view />
    </div>

    <modals-container />

    <bug-reporter />
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { tryOnBeforeMount } from '@vueuse/core';
    import { ModalsContainer } from 'vue-final-modal';
    import { useUIStore } from '@/store/UI/UIStore';
    import { useUserStore } from '@/store/UI/UserStore';
    import NavBar from '@/components/UI/menu/NavBar.vue';
    import BugReporter from '@/components/UI/BugReporter.vue';

    export default defineComponent({
        components: {
            ModalsContainer,
            BugReporter,
            NavBar
        },
        setup() {
            const uiStore = useUIStore();
            const userStore = useUserStore();

            const initUser = async () => {
                try {
                    if (await userStore.getUserStatus()) {
                        await userStore.getUserInfo();
                    }
                } catch (err) {
                    await userStore.clearUser();
                }
            };

            const initTheme = async () => {
                await uiStore.removeOldTheme();

                const html = document.querySelector('html');

                let avoidHtmlUpdate = false;

                if (html?.dataset?.theme) {
                    avoidHtmlUpdate = ['theme-light', 'theme-dark'].includes(html?.dataset?.theme);
                }

                uiStore.setTheme({
                    name: uiStore.getCookieTheme(),
                    avoidHtmlUpdate
                });
            };

            tryOnBeforeMount(async () => {
                await initTheme();
                await initUser();
            });
        }
    });
</script>
