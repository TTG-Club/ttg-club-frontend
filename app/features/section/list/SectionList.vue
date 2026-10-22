<script setup lang="ts" generic="T">
  import type { AsyncDataRequestStatus } from '#app';

  import {
    groupItems,
    INFINITE_SCROLL_DISTANCE,
    SECTION_GRID_CLASS,
    SECTION_ICON,
    SECTION_TEXT,
  } from '../model';

  /**
   * Список раздела с подгрузкой при прокрутке и необязательными группами
   * (например, заклинания по уровням).
   */
  const {
    items,
    getKey,
    getGroup = undefined,
    status,
    isEnd = true,
    isLoadingMore = false,
    isGrid = false,
  } = defineProps<{
    items: Array<T>;
    getKey: (item: T) => string;
    getGroup?: (item: T) => string;
    status: AsyncDataRequestStatus;
    isEnd?: boolean;
    isLoadingMore?: boolean;
    /** Крупные карточки, как у рас и классов, вместо плиток-строк. */
    isGrid?: boolean;
  }>();

  const emit = defineEmits<{
    'load-more': [];
    'retry': [];
  }>();

  defineSlots<{
    default: (props: { item: T }) => unknown;
  }>();

  const groups = computed(() =>
    getGroup ? groupItems(items, getGroup) : [{ name: '', items }],
  );

  // Колонки считаются от ширины самого списка, а не экрана: в широком
  // режиме рядом стоит панель записи, и списку достаётся меньше места
  const groupClass = computed(() =>
    isGrid ? SECTION_GRID_CLASS.cards : SECTION_GRID_CLASS.tiles,
  );

  const isFirstLoading = computed(() => status === 'pending' && !items.length);

  const isError = computed(() => status === 'error');

  const isEmpty = computed(() => status === 'success' && !items.length);

  const sentinel = useTemplateRef('sentinel');

  const isSentinelVisible = useElementVisibility(sentinel, {
    rootMargin: `0px 0px ${INFINITE_SCROLL_DISTANCE}px 0px`,
  });

  // Пока низ списка рядом, страницы подгружаются одна за другой.
  watchEffect(() => {
    if (isSentinelVisible.value && !isEnd && !isLoadingMore && items.length) {
      emit('load-more');
    }
  });
</script>

<template>
  <div
    v-if="isFirstLoading"
    class="flex flex-col gap-2"
  >
    <USkeleton
      v-for="index in 8"
      :key="index"
      class="h-12.5 w-full rounded-xl"
    />
  </div>

  <UEmpty
    v-else-if="isError"
    :icon="SECTION_ICON.empty"
    :title="SECTION_TEXT.error"
    :actions="[
      {
        label: SECTION_TEXT.retry,
        color: 'neutral',
        variant: 'subtle',
        onClick: () => emit('retry'),
      },
    ]"
  />

  <UEmpty
    v-else-if="isEmpty"
    :icon="SECTION_ICON.empty"
    :title="SECTION_TEXT.empty"
  />

  <div
    v-else
    class="@container flex flex-col gap-4"
  >
    <section
      v-for="group in groups"
      :key="group.name"
      class="flex flex-col gap-2"
    >
      <h2
        v-if="group.name"
        class="flex items-center gap-3 pt-2 text-sm font-semibold text-muted after:h-px after:flex-auto after:bg-(--ui-border)"
      >
        {{ group.name }}
      </h2>

      <div :class="groupClass">
        <template
          v-for="item in group.items"
          :key="getKey(item)"
        >
          <slot :item="item" />
        </template>
      </div>
    </section>

    <div
      ref="sentinel"
      class="h-px"
    />

    <USkeleton
      v-if="isLoadingMore"
      class="h-12 w-full"
    />
  </div>
</template>
