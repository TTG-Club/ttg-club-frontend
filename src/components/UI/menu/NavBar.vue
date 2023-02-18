<template>
    <div class="navbar">
        <header class="navbar__header">
            <div class="navbar__header_left">
                <router-link
                    class="navbar__logo"
                    :to="{ name: 'index' }"
                >
                    <site-logo />
                </router-link>

                <nav-menu />

                <nav-bookmarks />

                <nav-search v-if="isShowSearch" />
            </div>

            <div class="navbar__header_right">
                <div class="navbar__social-buttons">
                    <ui-social-button
                        social-name="boosty"
                        url="https://boosty.to/dnd5club"
                        hide-label
                    />

                    <ui-social-button
                        social-name="vk"
                        url="https://vk.com/ttg.club"
                        hide-label
                    />

                    <ui-social-button
                        social-name="discord"
                        url="https://discord.gg/zqBnMJVf3z"
                        hide-label
                    />

                    <hr />
                </div>

                <nav-profile />

                <menu-theme-switcher />
            </div>
        </header>
    </div>
</template>

<script lang="ts">
    import { computed, defineComponent } from 'vue';
    import { useRoute } from 'vue-router';
    import MenuThemeSwitcher from '@/components/UI/MenuThemeSwitcher.vue';
    import NavProfile from '@/components/UI/menu/NavProfile.vue';
    import NavBookmarks from '@/components/UI/menu/bookmarks/NavBookmarks.vue';
    import NavMenu from '@/components/UI/menu/NavMenu.vue';
    import NavSearch from '@/components/UI/menu/NavSearch.vue';
    import UiSocialButton from '@/components/UI/kit/UiSocialButton.vue';
    import SiteLogo from '@/components/UI/icons/SiteLogo.vue';

    export default defineComponent({
        name: 'NavBar',
        components: {
            SiteLogo,
            NavSearch,
            NavMenu,
            NavBookmarks,
            NavProfile,
            MenuThemeSwitcher,
            UiSocialButton
        },
        setup() {
            const route = useRoute();

            const isShowSearch = computed(() => route.name !== 'search-page');

            return {
                isShowSearch
            };
        }
    });
</script>

<style lang="scss" scoped>
    .navbar__header_left {
        .navbar__logo {
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
    .navbar__header_right {
        .navbar__social-buttons {
            display: none;

            @include media-min($md) {
                display: block;
            }

            .ui-social-button {
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                justify-content: center;
                border-radius: 8px;

                &.is-discord {
                    background-color: transparent;
                    color: var(--color-text);

                    &:hover {
                        background-color: var(--discord-base);
                        color: var(--text-btn-color);
                    }
                }
                &.is-boosty {
                    background-color: transparent;
                    color: var(--color-text);

                    &:hover {
                        background-color: var(--boosty-base);
                        color: var(--text-btn-color);
                    }
                }
                &.is-vk {
                    background-color: transparent;
                    color: var(--color-text);

                    &:hover {
                        background-color: var(--vk-base);
                        color: var(--text-btn-color);
                    }
                }
            }
        }
    }
</style>
