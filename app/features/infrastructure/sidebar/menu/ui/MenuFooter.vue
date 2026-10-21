<script setup lang="ts">
  import {
    MENU_CONTACT_LINKS,
    MENU_CONTACTS_LABEL,
    MENU_SUPPORT_LABEL,
    MENU_SUPPORT_LINKS,
  } from '../model';
</script>

<template>
  <footer
    class="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm text-muted"
  >
    <div class="flex flex-wrap items-center gap-1">
      <span>{{ MENU_CONTACTS_LABEL }}</span>

      <UButton
        v-for="link in MENU_CONTACT_LINKS"
        :key="link.url"
        :to="link.url"
        :icon="link.icon"
        :aria-label="link.label"
        target="_blank"
        color="neutral"
        variant="ghost"
      />
    </div>

    <div class="flex flex-wrap items-center gap-1">
      <span>{{ MENU_SUPPORT_LABEL }}</span>

      <UButton
        v-for="link in MENU_SUPPORT_LINKS"
        :key="link.url"
        :to="link.url"
        :icon="link.icon"
        :aria-label="link.label"
        :label="link.title"
        target="_blank"
        color="neutral"
        variant="ghost"
      />
    </div>
  </footer>
</template>
