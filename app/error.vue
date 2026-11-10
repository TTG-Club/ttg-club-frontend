<script setup lang="ts">
  import type { NuxtError } from '#app';

  import {
    ERROR_MESSAGE_UNKNOWN,
    ERROR_MESSAGES,
    ERROR_PAGE,
    NOT_FOUND_STATUS,
  } from '~/shared/consts';
  import { useMaintenanceGate } from '~infrastructure/maintenance/composables';
  import { MaintenanceScreen } from '~infrastructure/maintenance/ui';

  const { error } = defineProps<{
    error: NuxtError;
  }>();

  const title = computed(() =>
    error.statusCode === NOT_FOUND_STATUS
      ? ERROR_PAGE.notFoundTitle
      : ERROR_PAGE.defaultTitle,
  );

  // Фразы и ссылка на главную — как на страницах ошибок старого SPA
  const message = computed(
    () => ERROR_MESSAGES[error.statusCode ?? 0] ?? ERROR_MESSAGE_UNKNOWN,
  );

  useSeoMeta({
    title,
    robots: 'noindex',
  });

  // Страница ошибки рисуется без app.vue — тему ставит сама
  useThemeHead();

  // При закрытом сайте ошибка (например, 404) не показывается — посетитель
  // видит ту же заглушку.
  const { isBlocked: isMaintenanceBlocked } = useMaintenanceGate();

  function goHome() {
    clearError({ redirect: '/' });
  }
</script>

<template>
  <UApp>
    <MaintenanceScreen v-if="isMaintenanceBlocked" />

    <NuxtLayout v-else>
      <section
        class="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center"
      >
        <h1 class="font-serif text-6xl text-title">
          {{ message.heading }}
        </h1>

        <p class="max-w-xl text-xl text-title">
          {{ message.before }}

          <a
            href="/"
            class="text-link hover:text-link-hover"
            @click.left.exact.prevent="goHome"
            >{{ message.link }}</a
          >

          {{ message.after }}
        </p>
      </section>
    </NuxtLayout>
  </UApp>
</template>
