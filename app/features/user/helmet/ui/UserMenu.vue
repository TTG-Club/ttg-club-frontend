<script setup lang="ts">
  import { breakpointsTailwind } from '@vueuse/core';

  import {
    getGreeting,
    PROFILE_ROUTE,
    SIGN_OUT_LABEL,
    USER_HELMET_ICON,
    USER_MENU_ADMIN_LINK,
    USER_MENU_BUTTON_LABEL,
    USER_MENU_LEGACY_LINKS,
    USER_MENU_PROFILE_LINK,
  } from '../../model';

  const { user, isEditor, signOut } = useUser();
  const breakpoints = useBreakpoints(breakpointsTailwind);

  const isOpened = ref(false);

  const side = computed(() =>
    breakpoints.greaterOrEqual('md').value ? 'right' : 'top',
  );

  // Час берётся только в браузере: меню рендерится по открытию, поэтому
  // разницы между SSR и клиентом нет.
  const greeting = computed(() =>
    isOpened.value ? getGreeting(new Date().getHours()) : '',
  );

  function close(): void {
    isOpened.value = false;
  }

  async function handleSignOut() {
    isOpened.value = false;
    await signOut();
  }
</script>

<template>
  <UPopover
    v-model:open="isOpened"
    :content="{ side }"
    :ui="{ content: 'w-64 p-1' }"
  >
    <UButton
      :icon="USER_HELMET_ICON"
      :aria-label="USER_MENU_BUTTON_LABEL"
      color="neutral"
      variant="ghost"
      size="xl"
    />

    <template #content>
      <p class="px-2.5 py-2 text-sm">
        {{ greeting }},
        <span class="font-semibold text-title">{{ user?.username }}</span>
      </p>

      <USeparator class="my-1" />

      <UButton
        :to="PROFILE_ROUTE"
        :icon="USER_MENU_PROFILE_LINK.icon"
        :label="USER_MENU_PROFILE_LINK.label"
        color="neutral"
        variant="ghost"
        block
        :ui="{ base: 'justify-start' }"
        @click.left.exact="close"
      />

      <!-- Админка и мастерская открыты только редакторам -->
      <template v-if="isEditor">
        <UButton
          :to="USER_MENU_ADMIN_LINK.to"
          :icon="USER_MENU_ADMIN_LINK.icon"
          :label="USER_MENU_ADMIN_LINK.label"
          color="neutral"
          variant="ghost"
          block
          :ui="{ base: 'justify-start' }"
          @click.left.exact="close"
        />

        <UButton
          v-for="link in USER_MENU_LEGACY_LINKS"
          :key="link.url"
          :to="link.url"
          :icon="link.icon"
          :label="link.label"
          external
          color="neutral"
          variant="ghost"
          block
          :ui="{ base: 'justify-start' }"
        />
      </template>

      <USeparator class="my-1" />

      <UButton
        :label="SIGN_OUT_LABEL"
        icon="tabler:logout"
        color="error"
        variant="ghost"
        block
        :ui="{ base: 'justify-start' }"
        @click.left.exact.prevent="handleSignOut"
      />
    </template>
  </UPopover>
</template>
