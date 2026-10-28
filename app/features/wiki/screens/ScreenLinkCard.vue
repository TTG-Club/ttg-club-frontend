<script setup lang="ts">
  import type { ScreenLink } from '../model';

  import ScreenIcon from './ScreenIcon.vue';

  /**
   * Вложенный раздел ширмы: иконка, название, источник. Клик открывает
   * раздел в дровере, а ссылка ведёт на его страницу.
   */
  const { screen } = defineProps<{
    screen: ScreenLink;
  }>();

  const emit = defineEmits<{
    open: [path: string];
  }>();

  function open() {
    emit('open', screen.url);
  }
</script>

<template>
  <!-- Обычная ссылка: обработчик NuxtLink перешёл бы на страницу раньше -->
  <a
    :href="screen.url"
    class="flex h-full items-center gap-3 rounded-lg border border-default bg-elevated/50 p-4 transition-colors hover:bg-elevated"
    @click.left.exact.prevent="open"
  >
    <ScreenIcon :markup="screen.icon" />

    <span class="min-w-0">
      <span class="block font-semibold text-highlighted">
        {{ screen.name.rus }}
      </span>

      <span class="block text-sm">
        <UTooltip
          v-if="screen.source"
          :text="screen.source.name"
        >
          <span>{{ screen.source.shortName }}</span>
        </UTooltip>

        <span
          v-if="screen.source"
          class="mx-1"
          >/</span
        >

        <span>{{ screen.name.eng }}</span>
      </span>
    </span>
  </a>
</template>
