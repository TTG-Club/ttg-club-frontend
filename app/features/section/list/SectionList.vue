<script setup lang="ts" generic="T">
  import type { AsyncDataRequestStatus } from '#app';

  import {
    groupItems,
    INFINITE_SCROLL_DISTANCE,
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
    isDetailOpen = false,
  } = defineProps<{
    items: Array<T>;
    getKey: (item: T) => string;
    getGroup?: (item: T) => string;
    status: AsyncDataRequestStatus;
    isEnd?: boolean;
    isLoadingMore?: boolean;
    /** Карточки в сетку вместо строк. */
    isGrid?: boolean;
    /** Рядом открыта запись: сетке остаётся меньше места. */
    isDetailOpen?: boolean;
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

  const groupClass = computed(() => {
    if (!isGrid) {
      return 'flex flex-col gap-1';
    }

    return isDetailOpen
      ? 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2'
      : 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5';
  });

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
      class="h-12 w-full"
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
    class="flex flex-col gap-4"
  >
    <section
      v-for="group in groups"
      :key="group.name"
      class="flex flex-col gap-1"
    >
      <h2
        v-if="group.name"
        class="pt-2 text-sm font-semibold text-muted"
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
