<script setup lang="ts">
  import { PROFILE_SECTIONS, PROFILE_TEXT } from '../model';

  /**
   * Переключатель разделов личного кабинета: на телефоне лента вкладок,
   * на широком экране колонка в боковой панели.
   */
</script>

<template>
  <nav
    :aria-label="PROFILE_TEXT.navigation"
    class="-mx-4 scrollbar-none flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
  >
    <UButton
      v-for="section in PROFILE_SECTIONS"
      :key="section.to"
      :to="section.to"
      :label="section.label"
      :icon="section.icon"
      active-variant="soft"
      active-color="primary"
      color="neutral"
      variant="ghost"
      class="shrink-0 lg:w-full"
      exact
    />
  </nav>
</template>
