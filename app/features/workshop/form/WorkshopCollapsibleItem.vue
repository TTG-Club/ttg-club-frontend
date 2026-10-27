<script setup lang="ts">
  import {
    WORKSHOP_ICON,
    WORKSHOP_PINNED_HEADER_CLASS,
    WORKSHOP_TEXT,
  } from '../model';

  /**
   * Элемент списка под спойлером: свёрнутым показывает только шапку.
   * Шапка раскрытого прилипает к верху экрана, чтобы на длинном описании
   * было видно, чей это элемент.
   */
  const { title, removeLabel, isOpen } = defineProps<{
    /** Название элемента; пустое заменяется заглушкой. */
    title: string;
    /** Элемент раскрыт. */
    isOpen: boolean;
    /** Подпись кнопки удаления для скринридера. */
    removeLabel: string;
  }>();

  const emit = defineEmits<{
    toggle: [];
    remove: [];
  }>();

  const headerTitle = computed(() => title || WORKSHOP_TEXT.untitled);

  const headerClass = computed(() =>
    isOpen ? WORKSHOP_PINNED_HEADER_CLASS : '',
  );

  const toggleIcon = computed(() =>
    isOpen ? WORKSHOP_ICON.collapse : WORKSHOP_ICON.expand,
  );

  const toggleLabel = computed(() =>
    isOpen ? WORKSHOP_TEXT.collapse : WORKSHOP_TEXT.expand,
  );

  function toggle(): void {
    emit('toggle');
  }

  function remove(): void {
    emit('remove');
  }
</script>

<template>
  <div
    class="rounded-lg border border-default bg-elevated/20 transition-colors focus-within:border-primary/60"
  >
    <div
      class="relative flex min-h-10 items-center gap-2 px-3 py-2"
      :class="headerClass"
    >
      <!-- Шапка разворачивает элемент целиком. Кнопки лежат рядом, а не
        внутри: нажатие ловит псевдоэлемент во всю шапку, а кнопки подняты
        над ним через relative -->
      <button
        type="button"
        class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left before:absolute before:inset-0"
        :aria-expanded="isOpen"
        @click.left.exact.prevent="toggle"
      >
        <slot name="leading" />

        <span class="min-w-0 flex-1 truncate text-highlighted">
          {{ headerTitle }}
        </span>

        <slot name="trailing" />
      </button>

      <UButton
        :aria-label="removeLabel"
        :icon="WORKSHOP_ICON.remove"
        color="error"
        variant="ghost"
        size="xs"
        class="relative"
        @click.left.exact.prevent="remove"
      />

      <UButton
        :aria-label="toggleLabel"
        :icon="toggleIcon"
        color="neutral"
        variant="ghost"
        size="xs"
        class="relative"
        @click.left.exact.prevent="toggle"
      />
    </div>

    <div
      v-if="isOpen"
      class="p-3"
    >
      <slot />
    </div>
  </div>
</template>
