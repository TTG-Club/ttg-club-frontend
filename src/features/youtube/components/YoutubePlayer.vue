<script lang="ts" setup>
  import YoutubePlayIcon from '@/features/youtube/components/YoutubePlayIcon.vue';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

  export type ImageResolution =
    | 'default'
    | 'mqdefault'
    | 'hqdefault'
    | 'sddefault'
    | 'maxresdefault';

  const $style = useCssModule();

  const props = withDefaults(
    defineProps<{
      video: TYoutubeVideo;
      showName?: boolean;
      params?: string;
      poster?: ImageResolution;
      muted?: boolean;
      rel?: 'prefetch' | 'preload';
      announce?: string;
      hasRadius?: boolean;
    }>(),
    {
      showName: false,
      params: '',
      poster: 'hqdefault',
      muted: false,
      rel: 'preload',
      announce: 'Смотреть',
      hasRadius: false,
    },
  );

  const emit = defineEmits(['init']);

  const iframe = ref(false);
  const iframeElement = ref<HTMLIFrameElement | null>(null);

  const videoId = computed(() => encodeURIComponent(props.video.id));

  const posterUrl = computed(
    () => `https://i.ytimg.com/vi_webp/${videoId.value}/${props.poster}.webp`,
  );

  const embedUrl = computed(
    () => `https://www.youtube.com/embed/${videoId.value}`,
  );

  const urlWithParams = computed(
    () =>
      `${embedUrl.value}?autoplay=1&enablejsapi=1&state=1&mute=${
        props.muted ? 1 : 0
      }`,
  );

  const runCommand = (
    player: HTMLIFrameElement | null,
    func: 'stopVideo' | 'pauseVideo' | 'playVideo',
  ) => {
    if (player === null) {
      throw new Error('iframe element not instantiated.');
    }

    player.contentWindow?.postMessage(
      `{"event":"command","func":"${func}","args":""}`,
      '*',
    );
  };

  const initIframe = () => {
    if (iframe.value) {
      return;
    }

    iframe.value = true;

    emit('init');
  };

  defineExpose({
    getInstance() {
      return iframeElement.value;
    },
    stopVideo() {
      runCommand(iframeElement.value, 'stopVideo');
    },
    pauseVideo() {
      runCommand(iframeElement.value, 'pauseVideo');
    },
    playVideo() {
      runCommand(iframeElement.value, 'playVideo');
    },
    initIframe,
  });
</script>

<template>
  <div
    :class="{
      [$style['youtube-player']]: true,
      [$style['is-active']]: iframe,
    }"
  >
    <link
      :href="posterUrl"
      :rel="rel"
      as="image"
    />

    <link
      href="https://www.youtube.com"
      rel="preconnect"
    />

    <link
      href="https://www.google.com"
      rel="preconnect"
    />

    <link
      href="https://static.doubleclick.net"
      rel="preconnect"
    />

    <link
      href="https://googleads.g.doubleclick.net"
      rel="preconnect"
    />

    <div
      :class="$style.body"
      @click.left.exact.stop.prevent="initIframe"
    >
      <div
        :class="{
          [$style.video]: true,
          [$style.radius]: hasRadius,
        }"
        :style="{ backgroundImage: `url(${posterUrl})` }"
      >
        <iframe
          v-if="iframe"
          ref="iframeElement"
          width="100%"
          height="100%"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          :class="$style.iframe"
          :allowfullscreen="true"
          :src="urlWithParams"
          :title="video.name"
        />

        <youtube-play-icon
          v-else
          :class="$style.btn"
          type="button"
          :aria-label="announce"
        />
      </div>

      <span
        v-if="props.showName"
        :class="$style.name"
        >{{ video.name }}</span
      >
    </div>
  </div>
</template>

<style module lang="scss">
  @use '@/assets/styles/variables/mixins' as *;

  .youtube-player {
    cursor: pointer;
    position: relative;
    display: block;
    width: 100%;

    .body {
      position: relative;
      width: 100%;
    }

    .video {
      position: relative;

      overflow: hidden;

      width: 100%;
      padding-bottom: calc(720 / 1280 * 100%);

      background-color: #000000;
      background: {
        position: center;
        size: cover;
      }

      &.radius {
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }
    }

    .iframe {
      position: absolute;
      top: 0;
      left: 0;

      width: 100%;
      height: 100%;
    }

    .btn {
      cursor: pointer;

      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate3d(-50%, -50%, 0);

      display: block;

      width: 68px;
      height: 48px;

      color: var(--youtube-base);

      border: none;

      @include css-anim(
        $item: color,
        $time: 0.2s,
        $style: cubic-bezier(0, 0, 0.2, 1)
      );
    }

    .name {
      display: block;

      padding: 8px;

      background-color: var(--bg-main);
      border-bottom-right-radius: 8px;
      border-bottom-left-radius: 8px;
    }

    &:hover,
    &:focus-within {
      .btn {
        color: var(--youtube-hover);

        @include css-anim(
          $item: color,
          $time: 0.2s,
          $style: cubic-bezier(0, 0, 0.2, 1)
        );
      }
    }

    &.is-active {
      cursor: unset;
    }
  }
</style>
