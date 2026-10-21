<script setup lang="ts">
  import type { HomeVideo } from '../model';

  import {
    HOME_VIDEO_EMBED_ALLOW,
    HOME_VIDEO_EMBED_PARAMS,
    HOME_VIDEO_EMBED_URL,
    HOME_VIDEO_PLAY_LABEL,
    HOME_VIDEO_POSTER_URL,
  } from '../model';

  /**
   * Плеер YouTube «по требованию»: до клика это обложка с кнопкой, фрейм
   * YouTube грузится только после неё — так главная не тянет чужие скрипты
   * ради ролика, который могут и не включить.
   */
  const { video } = defineProps<{
    video: HomeVideo;
  }>();

  const isStarted = ref(false);

  const videoId = computed(() => encodeURIComponent(video.id));

  const posterStyle = computed(() => ({
    backgroundImage: `url(${HOME_VIDEO_POSTER_URL}/${videoId.value}/hqdefault.webp)`,
  }));

  const embedUrl = computed(
    () => `${HOME_VIDEO_EMBED_URL}/${videoId.value}?${HOME_VIDEO_EMBED_PARAMS}`,
  );

  /** Запускает ролик: на место обложки встаёт фрейм YouTube. */
  function start(): void {
    isStarted.value = true;
  }
</script>

<template>
  <div
    :style="posterStyle"
    class="group relative aspect-video w-full overflow-hidden bg-main bg-cover bg-center"
  >
    <iframe
      v-if="isStarted"
      :src="embedUrl"
      :title="video.name"
      :allow="HOME_VIDEO_EMBED_ALLOW"
      allowfullscreen
      class="absolute inset-0 size-full border-0"
    />

    <button
      v-else
      type="button"
      :aria-label="HOME_VIDEO_PLAY_LABEL"
      class="absolute inset-0 flex cursor-pointer items-center justify-center"
      @click.left.exact.prevent="start"
    >
      <svg
        viewBox="0 0 68 48"
        aria-hidden="true"
        class="h-12 w-17 text-youtube transition-colors duration-200 group-hover:text-youtube-hover"
      >
        <path
          d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
          fill="currentColor"
        />

        <path
          d="M 45,24 27,14 27,34"
          fill="white"
        />
      </svg>
    </button>
  </div>
</template>
