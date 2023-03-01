<script lang="ts" setup>
    import {
        computed, h, ref
    } from 'vue';
    import IconYouTube from '@/components/UI/icons/IconYouTube.vue';

    export type ImageResolution =
        | 'default'
        | 'mqdefault'
        | 'hqdefault'
        | 'sddefault'
        | 'maxresdefault'

    const props = withDefaults(
        defineProps<{
            id: string
            params?: string
            poster?: ImageResolution
            muted?: boolean
            rel?: 'prefetch' | 'preload'
            announce?: string
        }>(),
        {
            params: '',
            poster: 'hqdefault',
            muted: false,
            rel: 'preload',
            announce: 'Смотреть'
        }
    );

    const emit = defineEmits(['init']);

    const iframe = ref(false);
    const iframeElement = ref<HTMLIFrameElement | null>(null);

    const videoId = computed(() => encodeURIComponent(props.id));
    const posterUrl = computed(() => `https://i.ytimg.com/vi_webp/${ videoId.value }/${ props.poster }.webp`);
    const embedUrl = computed(() => (`https://www.youtube.com/embed/${ videoId.value }`));

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
                'ui-youtube': true,
                'is-active': iframe.value
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
                    class: 'ui-youtube__body',
                    style: {
                        backgroundImage: `url(${ posterUrl.value })`
                    }
                },
                iframe.value
                    ? h('iframe', {
                        ref: iframeElement,
                        class: 'ui-youtube__iframe',
                        width: '100%',
                        height: '100%',
                        frameborder: 0,
                        allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture',
                        allowfullscreen: true,
                        src: urlWithParams.value
                    })
                    : h(IconYouTube, {
                        class: 'ui-youtube__btn',
                        type: 'button',
                        ariaLabel: props.announce
                    })
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

<style lang="scss">
    .ui-youtube {
        width: 100%;
        overflow: hidden;
        background-color: #000;
        position: relative;
        display: block;
        contain: content;
        background-position: 50%;
        background-size: cover;
        cursor: pointer;

        &__body {
            width: 100%;
            height: 100%;
            background: {
                size: cover;
                position: center;
            }
        }

        &__iframe {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
        }

        &__btn {
            @include css_anim($item: filter, $time: .2s, $style: cubic-bezier(0, 0, 0.2, 1));

            display: block;
            width: 68px;
            height: 48px;
            position: absolute;
            cursor: pointer;
            transform: translate3d(-50%, -50%, 0);
            top: 50%;
            left: 50%;
            z-index: 1;
            background-color: transparent;
            filter: grayscale(100%);
            border: none;
            color: #f00;
        }

        &:hover,
        &:focus-within {
            .ui-youtube {
                &__btn  {
                    @include css_anim($item: filter, $time: .2s, $style: cubic-bezier(0, 0, 0.2, 1));

                    filter: none;
                }
            }
        }

        &.is-active {
            cursor: unset;
        }
    }
</style>
