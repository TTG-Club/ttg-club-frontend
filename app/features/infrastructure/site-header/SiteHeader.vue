<script setup lang="ts">
  import {
    NEW_SITE_LABEL,
    NEW_SITE_URL,
    SITE_HOME_LABEL,
  } from '~/shared/consts';
  import { ThemeSwitcher } from '~infrastructure/theme-switcher';
</script>

<template>
  <header
    class="flex items-center justify-between gap-4 border-b border-default bg-secondary-surface px-4 py-2"
  >
    <NuxtLink
      to="/"
      class="font-serif text-lg font-semibold text-title"
    >
      {{ SITE_HOME_LABEL }}
    </NuxtLink>

    <div class="flex items-center gap-2">
      <ULink
        :to="NEW_SITE_URL"
        external
        class="text-sm text-link hover:text-link-hover"
      >
        {{ NEW_SITE_LABEL }}
      </ULink>

      <ThemeSwitcher />
    </div>
  </header>
</template>
