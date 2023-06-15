<script lang="ts" setup>
  import {
    computed, h, ref, useCssModule
  } from 'vue';
  import YoutubePlayIcon from '@/features/youtube/components/YoutubePlayIcon.vue';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube.types';

  export type ImageResolution =
    | 'default'
    | 'mqdefault'
    | 'hqdefault'
    | 'sddefault'
    | 'maxresdefault'

  const $style = useCssModule();

  const props = withDefaults(
    defineProps<{
      video: TYoutubeVideo
      showName?: boolean
      params?: string
      poster?: ImageResolution
      muted?: boolean
      rel?: 'prefetch' | 'preload'
      announce?: string
      hasRadius?: boolean
    }>(),
    {
      showName: false,
      params: '',
      poster: 'hqdefault',
      muted: false,
      rel: 'preload',
      announce: 'Смотреть',
      hasRadius: false
    }
  );

  const emit = defineEmits(['init']);

  const iframe = ref(false);
  const iframeElement = ref<HTMLIFrameElement | null>(null);

  const videoId = computed(() => encodeURIComponent(props.video.id));
  const posterUrl = computed(() => `https://i.ytimg.com/vi_webp/${ videoId.value }/${ props.poster }.webp`);

  const embedUrl = computed(() => (
    `https://www.youtube.com/embed/${ videoId.value }`
  ));

  const urlWithParams = computed(() => (
    `${ embedUrl.value }?autoplay=1&enablejsapi=1&state=1&mute=${ props.muted ? 1 : 0 }`
  ));

  const runCommand = (player: HTMLIFrameElement | null, func: 'stopVideo' | 'pauseVideo' | 'playVideo') => {
    if (player === null) {
      throw new Error('iframe element not instantiated.');
    }

    player.contentWindow?.postMessage(`{"event":"command","func":"${ func }","args":""}`, '*');
  };

  const initIframe = () => {
    if (iframe.value) {
      return;
    }

    iframe.value = true;

    emit('init');
  };

  const getLink = (href: string, rel?: string, as: string | null = null) => h(
    'link',
    {
      rel: rel || 'preconnect',
      as,
      href
    }
  );

  const player = () => h(
    'div',
    {
      class: {
        [$style['youtube-player']]: true,
        [$style['is-active']]: iframe.value
      }
    },
    [
      getLink(posterUrl.value, props.rel, 'image'),
      getLink('https://www.youtube.com'),
      getLink('https://www.google.com'),
      getLink('https://static.doubleclick.net'),
      getLink('https://googleads.g.doubleclick.net'),
      h(
        'div',
        {
          onClick: initIframe,
          class: $style.body
        },
        [
          h(
            'div',
            {
              class: {
                [$style.video]: true,
                [$style.radius]: props.hasRadius
              },
              style: {
                backgroundImage: `url(${ posterUrl.value })`
              }
            },
            iframe.value
              ? h('iframe', {
                ref: iframeElement,
                class: $style.iframe,
                width: '100%',
                height: '100%',
                frameborder: 0,
                allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture',
                allowfullscreen: true,
                src: urlWithParams.value
              })
              : h(YoutubePlayIcon, {
                class: $style.btn,
                type: 'button',
                ariaLabel: props.announce
              })
          ),
          props.showName
            ? h(
              'span',
              {
                class: $style.name
              },
              props.video.name
            )
            : null
        ]
      )
    ]
  );

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
    initIframe
  });
</script>

<template>
  <player />
</template>

<style module lang="scss">
  .youtube-player {
    width: 100%;
    position: relative;
    display: block;
    cursor: pointer;

    .body {
      position: relative;
      width: 100%;
    }

    .video {
      width: 100%;
      padding-bottom: calc(720 / 1280 * 100%);
      background-color: #000000;
      position: relative;
      overflow: hidden;
      background: {
        size: cover;
        position: center;
      };

      &.radius {
        border-radius: 12px;
      }
    }

    .iframe {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }

    .btn {
      @include css_anim($item: all, $time: .2s, $style: cubic-bezier(0, 0, 0.2, 1));

      display: block;
      width: 68px;
      height: 48px;
      position: absolute;
      cursor: pointer;
      transform: translate3d(-50%, -50%, 0);
      top: 50%;
      left: 50%;
      z-index: 1;
      border: none;
      color: var(--text-color);
    }

    .name {
      display: block;
      margin-top: 8px;
    }

    &:hover,
    &:focus-within {
      .btn {
        @include css_anim($item: all, $time: .2s, $style: cubic-bezier(0, 0, 0.2, 1));

        color: var(--bg-main);
      }
    }

    &.is-active {
      cursor: unset;
    }
  }
</style>
