<template>
  <vue-final-modal
    v-model="isShow"
    :class="$style.modal"
    content-transition="vfm-fade"
    esc-to-close
    focus-trap
    overlay-transition="vfm-fade"
    v-bind="$attrs"
  >
    <div :class="$style.container">
      <div :class="$style.wrapper">
        <div>{{ video?.name || 'Новое видео' }}</div>
      </div>
    </div>
  </vue-final-modal>
</template>

<script lang="ts" setup>
  import { VueFinalModal } from 'vue-final-modal';
  import { ref, watch } from 'vue';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube.types';

  type TProp = {
    video?: TYoutubeVideo;
  }

  const props = withDefaults(defineProps<TProp>(), {
    video: undefined
  });

  type TEmit = {
    (e: 'close'): void;
  }

  const emit = defineEmits<TEmit>();

  const isShow = ref(false);

  watch(() => props.video, value => {
    isShow.value = !!value;
  }, { immediate: true });
</script>

<style lang="scss" module>
  .modal {}

  .container {
    height: var(--max-vh);
    padding: 24px 24px 0;
    display: flex;
    flex-direction: column;
    max-width: 560px;
    width: 100vw;
    pointer-events: none;

    @include media-min($md) {
      padding: 56px 24px 0;
    }
  }

  .wrapper {
    background: var(--bg-secondary);
    overflow: hidden;
    border-radius: 12px;
    width: 100%;
    pointer-events: auto;
    box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
  }
</style>
