<template>
    <div class="navbar">
        <header class="navbar__header">
            <div class="navbar__header_left">
                <a
                    class="nav-menu__logo"
                    href="/"
                >
                    <site-logo />
                </a>

                <nav-menu />

                <nav-bookmarks />
            </div>

            <div class="navbar__header_right">
                <nav-profile />

                <menu-theme-switcher />
            </div>
        </header>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import MenuThemeSwitcher from '@/components/UI/MenuThemeSwitcher.vue';
    import NavProfile from '@/components/UI/menu/NavProfile.vue';
    import NavBookmarks from '@/components/UI/menu/bookmarks/NavBookmarks.vue';
    import NavMenu from '@/components/UI/menu/NavMenu.vue';

    export default defineComponent({
        name: 'NavBar',
        components: {
            NavMenu,
            NavBookmarks,
            NavProfile,
            MenuThemeSwitcher
        }
    });
</script>

<style lang="scss" scoped>
    .navbar__header_left {
        .site-logo {
            width: 50px;
            height: 50px;
        }

        .nav-menu__logo {
            width: 52px;
            height: 36px;
            padding: 0 16px 0 0;
            border-bottom: 0;
            border-right: 1px solid var(--border);
            margin: 0 8px 0 0;

            @include media-min($md) {
                width: 36px;
                height: 52px;
                padding: 0 0 16px 0;
                border-bottom: 1px solid var(--border);
                border-right: 0;
                margin: 0 0 8px 0;
            }
        }
    }
</style>
