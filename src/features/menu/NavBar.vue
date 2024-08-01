<script lang="ts">
  import SiteLogo from '@/shared/ui/icons/SiteLogo.vue';
  import UiSocialButton from '@/shared/ui/kit/button/UiSocialButton.vue';

  import NavBookmarks from '@/features/bookmarks/components/NavBookmarks.vue';
  import NavDiceHistoryButton from '@/features/menu/NavDiceHistoryButton.vue';
  import NavMenu from '@/features/menu/NavMenu.vue';
  import NavProfile from '@/features/menu/NavProfile.vue';
  import NavSearch from '@/features/menu/NavSearch.vue';
  import MenuThemeSwitcher from '@/features/MenuThemeSwitcher.vue';

  export default defineComponent({
    name: 'NavBar',
    components: {
      SiteLogo,
      NavSearch,
      NavMenu,
      NavBookmarks,
      NavProfile,
      MenuThemeSwitcher,
      UiSocialButton,
      NavDiceHistoryButton,
    },
    setup() {
      const route = useRoute();

      const isShowSearch = computed(() => route.name !== 'search-page');

      return {
        isShowSearch,
      };
    },
  });
</script>

<template>
  <div class="navbar">
    <header class="navbar__header">
      <div class="navbar__header_left">
        <router-link
          :to="{ name: 'index' }"
          class="navbar__logo"
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
            hide-label
            social-name="boosty"
            url="https://boosty.to/dnd5club"
          />

          <ui-social-button
            hide-label
            social-name="vk"
            url="https://vk.com/ttg.club"
          />

          <ui-social-button
            hide-label
            social-name="discord"
            url="https://discord.gg/JqFKMKRtxv"
          />
        </div>

        <nav-dice-history-button />

        <nav-profile />

        <menu-theme-switcher />
      </div>
    </header>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .navbar__header_left {
    .navbar__logo {
      width: 52px;
      height: 36px;
      margin: 0 8px 0 0;
      padding: 0 16px 0 0;

      border-right: 1px solid var(--border);
      border-bottom: 0;

      @include media-min($md) {
        width: 44px;
        height: 60px;
        margin: 0 0 8px;
        padding: 0 0 24px;

        border-right: 0;
        border-bottom: 1px solid var(--border);
      }
    }
  }

  .navbar__header_right {
    .navbar__social-buttons {
      display: none;

      @include media-min($md) {
        display: block;
        margin-bottom: 24px;
      }

      .ui-social-button {
        display: flex;
        justify-content: center;

        width: 40px;
        height: 40px;
        margin: 8px 0;
        padding: 0;

        opacity: 0.7;
        border-radius: 8px;

        &.is-discord {
          color: var(--text-btn-color);

          &:hover {
            background-color: var(--discord-hover);
          }
        }

        &.is-boosty {
          color: var(--text-btn-color);

          &:hover {
            background-color: var(--boosty-hover);
          }
        }

        &.is-vk {
          color: var(--text-btn-color);

          &:hover {
            background-color: var(--vk-hover);
          }
        }

        &:hover {
          opacity: 1;
        }
      }
    }
  }
</style>
