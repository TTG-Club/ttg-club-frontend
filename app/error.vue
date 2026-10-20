<script setup lang="ts">
  import type { NuxtError } from '#app';

  import { ERROR_PAGE, NOT_FOUND_STATUS } from '~/shared/consts';

  const { error } = defineProps<{
    error: NuxtError;
  }>();

  const title = computed(() =>
    error.statusCode === NOT_FOUND_STATUS
      ? ERROR_PAGE.notFoundTitle
      : ERROR_PAGE.defaultTitle,
  );

  useSeoMeta({
    title,
    robots: 'noindex',
  });

  function goHome() {
    clearError({ redirect: '/' });
  }
</script>

<template>
  <UApp>
    <NuxtLayout>
      <section class="flex flex-col items-start gap-4">
        <p class="text-5xl font-semibold text-title">
          {{ error.statusCode }}
        </p>

        <h1 class="font-serif text-2xl text-title">
          {{ title }}
        </h1>

        <UButton
          :label="ERROR_PAGE.homeLabel"
          @click.left.exact.prevent="goHome"
        />
      </section>
    </NuxtLayout>
  </UApp>
</template>
