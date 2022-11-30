<template>
    <div
        class="navbar"
        :class="{ 'is-scrolled': isScrolled }"
    >
        <header class="navbar__header">
            <div class="navbar__header_left">
                <nav-menu/>

                <div class="navbar__section">
                    <a
                        class="navbar__link"
                        href="/"
                    >TTG Club</a>

                    <div
                        v-if="section"
                        class="navbar__text"
                    >
                        <span>/</span>

                        <span>{{ section }}</span>
                    </div>
                </div>
            </div>

            <div class="navbar__header_right">
                <nav-bookmarks/>

                <nav-profile/>

                <menu-theme-switcher/>
            </div>
        </header>
    </div>
</template>

<script lang="ts">
    import { computed, defineComponent } from 'vue';
    import MenuThemeSwitcher from '@/components/UI/MenuThemeSwitcher.vue';
    import NavProfile from "@/components/UI/menu/NavProfile.vue";
    import NavBookmarks from "@/components/UI/menu/bookmarks/NavBookmarks.vue";
    import NavMenu from "@/components/UI/menu/NavMenu.vue";
    import { useUIStore } from '@/store/UI/UIStore';

    export default defineComponent({
        name: "NavBar",
        components: {
            NavMenu,
            NavBookmarks,
            NavProfile,
            MenuThemeSwitcher
        },
        props: {
            section: {
                type: String,
                default: ''
            }
        },
        setup() {
            const uiStore = useUIStore();

            return {
                isScrolled: computed(() => uiStore.bodyScroll.y > 0)
            };
        }
    });
</script>
