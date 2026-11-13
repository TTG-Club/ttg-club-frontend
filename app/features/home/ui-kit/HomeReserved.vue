<script setup lang="ts">
  import {
    HOME_RESERVED_ICON,
    HOME_RESERVED_LABEL,
    HOME_RESERVED_ROW_COUNT,
  } from '../model';
  import HomeEyebrow from './HomeEyebrow.vue';

  /**
   * Место в запасе под будущий блок: очертания панели со строками ленты и
   * подпись поверх. Очертания неподвижны — пустое место не должно мигать и
   * тянуть на себя взгляд, как скелетон загрузки.
   */
</script>

<template>
  <section
    :aria-label="HOME_RESERVED_LABEL"
    class="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-dashed border-default"
  >
    <div
      aria-hidden="true"
      class="flex flex-auto flex-col opacity-60"
    >
      <div class="border-b border-dashed border-default px-3 py-2.5">
        <span class="block h-2.75 w-24 rounded bg-elevated" />
      </div>

      <div class="flex flex-auto flex-col justify-center gap-1 p-2">
        <div
          v-for="index in HOME_RESERVED_ROW_COUNT"
          :key="index"
          class="flex items-center gap-3 p-2"
        >
          <span class="h-16 w-24 shrink-0 rounded-md bg-elevated" />

          <span class="flex flex-1 flex-col gap-2">
            <span class="h-2.5 w-16 rounded bg-elevated" />

            <span class="h-4 w-3/4 rounded bg-elevated" />
          </span>
        </div>
      </div>

      <div class="border-t border-dashed border-default px-3 py-2.5">
        <span class="block h-2.75 w-28 rounded bg-elevated" />
      </div>
    </div>

    <!-- Подпись на плашке цвета страницы: очертания строк под ней не
      просвечивают и не спорят с текстом -->
    <span class="absolute inset-0 flex items-center justify-center p-3">
      <span
        class="flex min-w-0 items-center rounded-lg border border-default bg-main px-3 py-2.5 shadow-legacy"
      >
        <HomeEyebrow
          :label="HOME_RESERVED_LABEL"
          :icon="HOME_RESERVED_ICON"
        />
      </span>
    </span>
  </section>
</template>
