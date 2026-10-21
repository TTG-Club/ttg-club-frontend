<script setup lang="ts">
  import { MENU_PATH } from '~/shared/consts';
  import { HamburgerIcon } from '~/shared/ui/hamburger-icon';
  import { SiteLogo } from '~/shared/ui/site-logo';

  import { SidebarPopover } from '../popover';
  import {
    buildMenuGroups,
    MENU_ERROR_TEXT,
    MENU_SITE_DESCRIPTION,
    MENU_SITE_TITLE,
    MENU_TOGGLE_LABEL,
    siteMenuSchema,
  } from './model';
  import { MenuFooter, MenuSection } from './ui';

  /** Ключ данных меню: одно на всё приложение. */
  const MENU_DATA_KEY = 'site-menu';

  const route = useRoute();

  const isOpened = ref(false);

  // Меню грузится при первом открытии, как в старом SPA: на каждой странице
  // оно не нужно, а его запрос не должен задерживать рендер.
  const {
    data: groups,
    status,
    execute,
  } = useAsyncData(
    MENU_DATA_KEY,
    async () =>
      buildMenuGroups(
        siteMenuSchema.parse(await $fetch(MENU_PATH)),
        import.meta.dev,
      ),
    { server: false, immediate: false, default: () => [] },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isFailed = computed(() => status.value === 'error');

  watch(isOpened, (value) => {
    if (value && status.value !== 'success') {
      execute();
    }
  });

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
      <header class="flex items-center gap-4 px-4 py-4">
        <NuxtLink
          to="/"
          class="size-16 shrink-0"
        >
          <SiteLogo />
        </NuxtLink>

        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-sm text-muted">{{ MENU_SITE_DESCRIPTION }}</span>

          <span class="text-2xl leading-none font-semibold text-title">
            {{ MENU_SITE_TITLE }}
          </span>
        </div>
      </header>

      <USeparator />

      <nav class="@container px-2 pt-4">
        <div
          v-if="isLoading"
          class="flex justify-center py-8"
        >
          <UIcon
            name="tabler:loader-2"
            class="size-6 animate-spin text-dimmed"
          />
        </div>

        <p
          v-else-if="isFailed"
          class="px-2.5 pb-6 text-muted"
        >
          {{ MENU_ERROR_TEXT }}
        </p>

        <div
          v-else
          class="columns-1 gap-3 @sm:columns-2 @2xl:columns-3 @4xl:columns-4"
        >
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
