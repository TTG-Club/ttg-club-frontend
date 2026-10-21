<script setup lang="ts">
  import { HOME_PLACEHOLDER } from '~/shared/consts';
</script>

<template>
  <section class="flex flex-col gap-3">
    <h1 class="font-serif text-2xl font-semibold text-title">
      {{ HOME_PLACEHOLDER.title }}
    </h1>

    <p>{{ HOME_PLACEHOLDER.description }}</p>
  </section>
</template>
