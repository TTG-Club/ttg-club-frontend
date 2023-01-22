<template>
    <div class="navbar">
        <header class="navbar__header">
            <div class="navbar__header_left">
                <hr />

                <hr />

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

        hr {
            width: 100%;
        }
    }
</style>
