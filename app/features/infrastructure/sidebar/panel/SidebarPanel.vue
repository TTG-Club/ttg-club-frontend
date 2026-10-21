<script setup lang="ts">
  import { SiteLogo } from '~/shared/ui/site-logo';
  import { BookmarksPanel } from '~bookmarks/panel';
  import { DiceHistoryToggle } from '~dice-roller/history';
  import { ThemeSwitcher } from '~infrastructure/theme-switcher';
  import { UserHelmet } from '~user/helmet';

  import { AppMenu } from '../menu';
</script>

<template>
  <!-- Как в старом SPA: на телефоне панель внизу, на десктопе слева -->
  <div
    class="fixed bottom-0 left-0 z-100 flex h-(--navbar-height) w-full border-t border-default bg-main pb-[env(safe-area-inset-bottom)] md:top-0 md:h-dvh md:w-(--navbar-width) md:flex-col md:border-t-0 md:border-r md:pb-0"
  >
    <header
      class="flex size-full items-center justify-between px-4 md:flex-col md:px-0 md:py-6"
    >
      <div class="flex items-center gap-2 md:flex-col">
        <NuxtLink
          to="/"
          class="hidden size-11 border-default md:mb-2 md:block md:h-15 md:border-b md:pb-4"
        >
          <SiteLogo />
        </NuxtLink>

        <ClientOnly>
          <AppMenu />

          <template #fallback>
            <div class="size-10" />
          </template>
        </ClientOnly>

        <ClientOnly>
          <BookmarksPanel />

          <template #fallback>
            <div class="size-10" />
          </template>
        </ClientOnly>
      </div>

      <div class="flex items-center gap-2 md:flex-col">
        <!-- На десктопе история открывается плавающей кнопкой -->
        <ClientOnly>
          <DiceHistoryToggle class="md:hidden" />
        </ClientOnly>

        <UserHelmet />

        <ThemeSwitcher />
      </div>
    </header>
  </div>
</template>
