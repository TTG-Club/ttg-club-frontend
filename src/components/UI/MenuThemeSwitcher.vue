<template>
    <div
        class="navbar__btn"
        @click.left.exact.prevent="switchTheme"
    >
        <svg-icon
            :icon-name="`${icon}-theme`"
            :stroke-enable="false"
            fill-enable
        />
    </div>
</template>

<script>
    import { computed } from "vue";
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import { useUIStore } from '@/store/UI/UIStore';

    export default {
        name: 'MenuThemeSwitcher',
        components: { SvgIcon },
        setup() {
            const uiStore = useUIStore();

            const icon = computed(() => (uiStore.theme === 'dark'
                ? 'light'
                : 'dark'));

            const switchTheme = async () => {
                await uiStore.setTheme({ name: icon.value });
            };

            return {
                icon,
                switchTheme
            };
        }
    };
</script>
