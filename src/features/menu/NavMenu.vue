<template>
  <nav-popover
    v-model="isShowMenu"
    is-left
    is-menu
  >
    <template #trigger="{ isActive }">
      <div
        :class="{ 'is-active': isActive }"
        class="navbar__btn hamburger"
        @click.left.exact.prevent="isShowMenu = !isShowMenu"
      >
        <span class="line" />

        <span class="line" />

        <span class="line" />
      </div>
    </template>

    <template #default>
      <div class="nav-menu">
        <div class="nav-menu__header">
          <router-link
            :to="{ name: 'index' }"
            class="nav-menu__logo"
          >
            <site-logo />
          </router-link>

          <div class="nav-menu__info">
            <span class="nav-menu__info--desc"
              >Онлайн справочник по D&D 5e</span
            >

            <span class="nav-menu__info--title">TTG Club</span>
          </div>
        </div>

        <div
          v-if="showedNavItems.length"
          class="nav-menu__body"
        >
          <div
            v-for="(group, groupKey) in showedNavItems"
            :key="group.name + groupKey"
            class="nav-menu__group"
          >
            <div class="nav-menu__group_label">
              <div class="nav-menu__group_label">
                {{ group.name }}
              </div>

              <div
                v-if="group.icon"
                class="nav-menu__group_icon"
              >
                <svg-icon :icon="group.icon" />
              </div>
            </div>

            <div class="nav-menu__links">
              <div
                v-for="link in group.children"
                :key="link.url"
                class="nav-menu__link"
              >
                <a
                  v-if="!isRouteExist(link)"
                  :href="link.url"
                  :target="link.external ? '_blank' : '_self'"
                  class="nav-menu__link_label"
                  >{{ link.name }}</a
                >

                <router-link
                  v-else
                  :to="{ path: link.url }"
                  class="nav-menu__link_label"
                >
                  {{ link.name }}
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </nav-popover>
</template>

<script lang="ts">
  import { storeToRefs } from 'pinia';
  import { defineComponent, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import NavPopover from '@/features/menu/NavPopover.vue';

  import type { TNavItem } from '@/shared/stores/NavStore';
  import { useNavStore } from '@/shared/stores/NavStore';
  import SiteLogo from '@/shared/ui/icons/SiteLogo.vue';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  export default defineComponent({
    name: 'NavMenu',
    components: {
      NavPopover,
      SvgIcon,
      SiteLogo
    },
    setup() {
      const navStore = useNavStore();
      const { showedNavItems } = storeToRefs(navStore);
      const router = useRouter();
      const route = useRoute();
      const isShowMenu = ref(false);

      const isRouteExist = (link: TNavItem) => {
        if (!link.url) {
          return false;
        }

        if (link.external || link.url.startsWith('http')) {
          return false;
        }

        const currentResolved = router.resolve(route.path);

        if (!currentResolved.name) {
          return false;
        }

        if (!router.hasRoute(currentResolved.name)) {
          return false;
        }

        const resolved = router.resolve(link.url);

        if (!resolved.name) {
          return false;
        }

        return router.hasRoute(resolved.name);
      };

      watch(
        isShowMenu,
        async value => {
          if (value) {
            await navStore.initNavItems();
          }
        },
        {
          immediate: true
        }
      );

      return {
        isShowMenu,
        showedNavItems,
        isRouteExist
      };
    }
  });
</script>

<style lang="scss" scoped>
  .nav-menu {
    padding: 16px 16px 8px 16px;

    &__header {
      padding: 16px 16px 16px 16px;
      display: flex;
      align-items: center;

      @media (max-width: 600px) {
        padding: 16px 16px 16px 16px;
      }
    }

    &__logo {
      margin-right: 12px;
      width: 70px;
      height: 70px;
      flex-shrink: 0;

      @media (max-width: 600px) {
        width: 60px;
        height: 60px;
      }
    }

    &__info {
      display: flex;
      flex-direction: column;
      justify-content: center;

      &--desc {
        font-size: var(--h5-font-size);
        margin-bottom: 4px;
      }

      &--title {
        font-size: var(--h3-font-size);
        font-weight: 600;
      }

      &--desc,
      &--title {
        color: var(--text-b-color);
      }
    }

    &__body {
      padding: 8px 8px 0 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 48px;
      border-top: 1px solid var(--hover);

      @media (max-width: 600px) {
        gap: 0;
      }
    }

    &__links {
      padding: 0 8px;
    }

    &__group {
      display: flex;
      flex-direction: column;
      width: 240px;
      margin: 8px 0;

      @media (max-width: 600px) {
        width: 100%;
      }

      &_label {
        padding: 8px 8px 4px 8px;
        display: flex;
        opacity: 0.8;
        color: var(--text-g-color);
        font-size: inherit;
        font-weight: normal;
        width: 100%;
        position: relative;
        align-items: center;

        .nav-menu__group_label {
          background: var(--bg-secondary);
          align-items: center;

          &::after {
            content: '';
            width: 100%;
            height: 1px;
            background-color: var(--text-g-color);
            position: relative;
            left: 8px;
            top: 0;
          }
        }
      }

      &_icon {
        width: 32px;
        height: 32px;
        padding: 4px;
        flex-shrink: 0;
      }
    }

    &__link {
      @include css_anim();

      display: flex;
      border-radius: 6px;

      &_label {
        @include css_anim();

        color: var(--text-color);
        font-weight: 400;
        padding: 8px;
        width: 100%;
        display: flex;
        border-radius: 6px;
        font-size: var(--main-font-size);

        &.router-link-active {
          color: var(--text-btn-color);
          background-color: var(--primary-active);
        }
      }

      &_icon {
        @include css_anim();

        width: 32px;
        height: 32px;
        padding: 8px;
        flex-shrink: 0;

        &.only-hover {
          &:not(.is-active) {
            opacity: 0;
          }
        }

        svg {
          stroke: var(--text-color) !important;
        }
      }

      @include media-min($xl) {
        &:hover {
          .nav-menu {
            &__link {
              &_icon {
                &.only-hover {
                  opacity: 1;
                }
              }

              &_label,
              &_icon {
                cursor: pointer;
                color: var(--text-btn-color);
              }

              &_label {
                background-color: var(--primary-hover);
              }
            }
          }
        }
      }
    }
  }
</style>