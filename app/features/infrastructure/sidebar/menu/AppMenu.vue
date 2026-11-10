<script setup lang="ts">
  import { HamburgerIcon } from '~/shared/ui/hamburger-icon';
  import { SiteLogo } from '~/shared/ui/site-logo';

  import { SidebarPopover } from '../popover';
  import { useSiteMenu } from './composables';
  import {
    buildMenuGroups,
    MENU_SITE_DESCRIPTION,
    MENU_SITE_TITLE,
    MENU_TOGGLE_LABEL,
  } from './model';
  import { MenuFooter, MenuSection } from './ui';

  const route = useRoute();

  const isOpened = ref(false);

  // Меню приходит вместе со страницей (а до ответа API стоит запасная копия),
  // поэтому при открытии оно уже готово: ни скелетона, ни запроса.
  const menuItems = useSiteMenu();

  const groups = computed(() =>
    buildMenuGroups(menuItems.value, import.meta.dev),
  );

  watch(
    () => route.fullPath,
    () => {
      isOpened.value = false;
    },
  );
</script>

<template>
  <SidebarPopover
    v-model="isOpened"
    is-menu
  >
    <template #trigger="{ isOpened: isActive, toggle }">
      <HamburgerIcon
        :is-active="isActive"
        :aria-label="MENU_TOGGLE_LABEL"
        @click.left.exact.prevent="toggle"
      />
    </template>

    <template #default>
      <header class="flex items-center gap-4 px-6 py-5">
        <NuxtLink
          to="/"
          class="w-14 shrink-0"
        >
          <SiteLogo />
        </NuxtLink>

        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-2xl leading-none font-semibold text-title">
            {{ MENU_SITE_TITLE }}
          </span>

          <span class="text-sm text-muted">{{ MENU_SITE_DESCRIPTION }}</span>
        </div>
      </header>

      <USeparator />

      <nav :class="$style.navigation">
        <div :class="$style.content">
          <MenuSection
            v-for="group in groups"
            :key="group.label"
            :group
          />
        </div>
      </nav>

      <USeparator />

      <MenuFooter />
    </template>
  </SidebarPopover>
</template>

<style lang="scss" module>
  // Колонки считаются от ширины самого меню, а не окна: меню уже окна
  .navigation {
    container-type: inline-size;
    padding: 24px 14px 0;
  }

  // Разделы идут сверху вниз и сами раскладываются по колонкам равной высоты,
  // поэтому под короткими разделами не остаётся пустых полей.
  .content {
    column-count: 2;
    column-gap: 12px;

    @container (width < 340px) {
      column-count: 1;
    }

    @container (width >= 620px) {
      column-count: 3;
    }

    // На широком меню разделы встают сеткой в два ряда: заполняются по
    // колонкам, поэтому порядок чтения тот же, а заголовки второго ряда
    // стоят на одной линии.
    @container (width >= 860px) {
      display: grid;
      grid-auto-flow: column;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      grid-template-rows: repeat(2, auto);
    }
  }
</style>
