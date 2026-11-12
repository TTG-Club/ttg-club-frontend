<script setup lang="ts">
  import {
    fetchRecentComments,
    filterLiveComments,
    readWithoutStaleToken,
  } from '~comments/model';

  import {
    HOME_COMMENTS_COUNT,
    HOME_COMMENTS_DATA_KEY,
    HOME_COMMENTS_EMPTY_TEXT,
    HOME_COMMENTS_ICON,
    HOME_COMMENTS_LABEL,
  } from '../model';
  import { HomePanel } from '../ui-kit';
  import { HomeCommentRow } from './ui';

  /**
   * Последние комментарии как на new.ttg.club, но только этого сайта:
   * сервис отбирает их по платформе. Грузятся на клиенте — блок ниже сгиба
   * и не должен задерживать ответ сервера.
   */
  const {
    data: recentComments,
    status,
    refresh,
  } = useAsyncData(
    HOME_COMMENTS_DATA_KEY,
    () =>
      readWithoutStaleToken(() => fetchRecentComments(0, HOME_COMMENTS_COUNT)),
    { lazy: true, server: false },
  );

  const comments = computed(() =>
    filterLiveComments(recentComments.value?.items ?? []),
  );

  // Главную держат открытой, а комментарии пишут прямо во время чтения —
  // при возврате на вкладку блок обновляется без F5
  const visibility = useDocumentVisibility();

  watch(visibility, (state, previous) => {
    if (state === 'visible' && previous === 'hidden') {
      refresh();
    }
  });

  // Скелетон только на первой загрузке: фоновое обновление не мигает поверх
  // уже показанных комментариев. До клиентского запроса статус `idle`
  const isLoading = computed(
    () =>
      (status.value === 'pending' || status.value === 'idle')
      && !comments.value.length,
  );
</script>

<template>
  <HomePanel
    :label="HOME_COMMENTS_LABEL"
    :icon="HOME_COMMENTS_ICON"
    flush
    detached
  >
    <div
      v-if="isLoading"
      class="flex flex-col gap-2 p-3"
    >
      <USkeleton
        v-for="index in HOME_COMMENTS_COUNT"
        :key="index"
        class="h-14 w-full rounded-xl"
      />
    </div>

    <!-- Ошибку сервиса не показываем: пустая заглушка держит раскладку -->
    <p
      v-else-if="!comments.length"
      class="m-3 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_COMMENTS_EMPTY_TEXT }}
    </p>

    <!-- С xl лента занимает высоту панели, которую задал ряд, ниже xl её
      держит собственный предел высоты -->
    <UScrollArea
      v-else
      class="max-h-150 xl:h-full xl:max-h-none"
      :ui="{ viewport: 'p-2' }"
    >
      <div class="flex flex-col gap-1">
        <HomeCommentRow
          v-for="comment in comments"
          :key="comment.id"
          :comment
        />
      </div>
    </UScrollArea>
  </HomePanel>
</template>
