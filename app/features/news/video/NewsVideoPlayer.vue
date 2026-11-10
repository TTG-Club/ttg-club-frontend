<script setup lang="ts">
  import {
    VIDEO_IFRAME_ALLOW,
    VIDEO_OPEN_SOURCE_LABEL,
    VIDEO_PLAY_ICON,
    VIDEO_PLAY_LABEL,
    VIDEO_PROVIDER_LABELS,
    VIDEO_UNSUPPORTED_TEXT,
  } from './constants';
  import { getVideoPoster, parseVideoUrl } from './utils';

  /**
   * Плеер ролика YouTube / ВК Видео. Сначала это заставка с кнопкой запуска, а
   * чужой плеер грузится только по нажатию: страница не тянет тяжёлый iframe
   * (и трекеры площадки) у тех, кто видео не смотрит. `autoplay` запускает
   * ролик сразу — для окна просмотра, открытого по кнопке.
   */
  const {
    url,
    title,
    poster = undefined,
    autoplay = false,
  } = defineProps<{
    /** Ссылка на ролик (как хранится в записи) */
    url: string;
    /** Название ролика — подпись плеера для экранных читалок */
    title: string;
    /** Своя заставка; без неё — превью площадки (только у YouTube) */
    poster?: string;
    /** Запустить ролик сразу, без заставки */
    autoplay?: boolean;
  }>();

  const source = computed(() => parseVideoUrl(url));

  const posterUrl = computed(() => getVideoPoster(url, poster));

  const providerLabel = computed(() =>
    source.value ? VIDEO_PROVIDER_LABELS[source.value.provider] : '',
  );

  const isPlaying = ref(autoplay);

  // Сменили ролик (листание записей в панели) — снова показываем заставку,
  // иначе новый ролик стартовал бы сам.
  watch(
    () => url,
    () => {
      isPlaying.value = autoplay;
    },
  );

  /** Запускает ролик: вместо заставки грузится плеер площадки. */
  function play(): void {
    isPlaying.value = true;
  }
</script>

<template>
  <div
    v-if="source"
    class="group relative aspect-video w-full overflow-hidden rounded-xl bg-black"
  >
    <iframe
      v-if="isPlaying"
      :src="source.embedUrl"
      :title
      :allow="VIDEO_IFRAME_ALLOW"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
      class="absolute inset-0 size-full border-0"
    />

    <button
      v-else
      type="button"
      class="absolute inset-0 flex cursor-pointer items-center justify-center"
      :aria-label="`${VIDEO_PLAY_LABEL}: ${title}`"
      @click.left.exact.prevent="play"
    >
      <img
        v-if="posterUrl"
        :src="posterUrl"
        :alt="title"
        class="absolute inset-0 size-full object-cover"
      />

      <span
        aria-hidden="true"
        class="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/20"
      />

      <span
        class="relative flex size-16 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/30 backdrop-blur-sm transition-transform group-hover:scale-110"
      >
        <UIcon
          :name="VIDEO_PLAY_ICON"
          class="size-7"
        />
      </span>

      <span
        class="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 font-mono text-[10px] leading-none tracking-[0.14em] text-white/80 uppercase"
      >
        {{ providerLabel }}
      </span>
    </button>

    <UButton
      :to="source.url"
      target="_blank"
      icon="tabler:external-link"
      size="xs"
      variant="ghost"
      class="absolute top-2 right-2 bg-black/50 text-white opacity-0 ring-1 ring-white/20 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/70 hover:text-white focus-visible:opacity-100"
      :aria-label="VIDEO_OPEN_SOURCE_LABEL"
    />
  </div>

  <p
    v-else
    class="rounded-xl border border-dashed border-default px-3 py-6 text-center text-sm text-muted"
  >
    {{ VIDEO_UNSUPPORTED_TEXT }}
  </p>
</template>
