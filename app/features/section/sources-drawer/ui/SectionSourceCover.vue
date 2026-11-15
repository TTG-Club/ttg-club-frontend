<script setup lang="ts">
  import { SECTION_ICON } from '../../model';

  /**
   * Обложка книги в строке панели источников, как на new.ttg.club: картинка
   * из списка книг или значок книги, у выбранной — рамка.
   */
  const { cover = undefined, isSelected = false } = defineProps<{
    /** Адрес обложки; без него — значок книги. */
    cover?: string;
    isSelected?: boolean;
  }>();

  const isBroken = ref(false);

  // Новая обложка заново получает шанс загрузиться
  watch(
    () => cover,
    () => {
      isBroken.value = false;
    },
  );

  const isCoverShown = computed(() => !!cover && !isBroken.value);

  const frameClass = computed(() =>
    isSelected ? 'ring ring-primary/40 text-muted' : 'opacity-60',
  );
</script>

<template>
  <span class="shrink-0">
    <span
      class="flex h-10 w-7 items-center justify-center overflow-hidden rounded-sm bg-elevated text-dimmed"
      :class="frameClass"
    >
      <img
        v-if="isCoverShown"
        :src="cover"
        alt=""
        loading="lazy"
        decoding="async"
        class="size-full object-cover"
        @error="isBroken = true"
      />

      <UIcon
        v-else
        :name="SECTION_ICON.book"
        class="size-4"
      />
    </span>
  </span>
</template>
