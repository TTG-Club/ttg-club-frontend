<script setup lang="ts">
  import {
    MENU_CONTACT_LINKS,
    MENU_SUPPORT_LINKS,
  } from '../../../navigation/model';
  import {
    MENU_CONTACTS_LABEL,
    MENU_EXTERNAL_TARGET,
    MENU_SUPPORT_LABEL,
  } from '../model';
</script>

<template>
  <footer
    :class="$style.footer"
    class="bg-elevated/40 text-sm text-muted"
  >
    <div :class="$style.contacts">
      <div class="flex flex-wrap items-center gap-2">
        <span>{{ MENU_CONTACTS_LABEL }}</span>

        <UButton
          v-for="link in MENU_CONTACT_LINKS"
          :key="link.url"
          :to="link.url"
          :icon="link.icon"
          :aria-label="link.label"
          :target="MENU_EXTERNAL_TARGET"
          color="neutral"
          variant="link"
        />
      </div>

      <USeparator
        :class="$style.divider"
        orientation="vertical"
        class="h-8"
      />

      <div class="flex flex-wrap items-center gap-2">
        <span>{{ MENU_SUPPORT_LABEL }}</span>

        <UButton
          v-for="link in MENU_SUPPORT_LINKS"
          :key="link.url"
          :to="link.url"
          :icon="link.icon"
          :aria-label="link.label"
          :label="link.title"
          :target="MENU_EXTERNAL_TARGET"
          color="neutral"
          variant="link"
        />
      </div>
    </div>
  </footer>
</template>

<style lang="scss" module>
  .footer {
    container-type: inline-size;
  }

  .contacts {
    display: flex;
    flex-direction: column;
    gap: 4px 12px;
    padding: 10px 24px;

    @container (width >= 800px) {
      flex-direction: row;
      align-items: center;
    }

    .divider {
      display: none;

      @container (width >= 800px) {
        display: inline-block;
      }
    }
  }
</style>
