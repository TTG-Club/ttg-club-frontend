<script setup lang="ts">
  import { type ImageRenderToolbarProps } from 'naive-ui';

  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  withDefaults(
    defineProps<{
      images: Array<string>;
      preview?: string | null;
      alt?: string;
      useBgHide?: boolean;
    }>(),
    {
      images: () => [],
      preview: '',
      alt: '',
      useBgHide: false,
    },
  );

  const bgHide = ref(false);

  const onToggleBg = () => {
    const modal = document.querySelector('.n-image-preview-overlay');
    const className = 'is-bg-hide';

    bgHide.value = !bgHide.value;

    if (!modal) {
      return;
    }

    if (bgHide.value) {
      modal.classList.add(className);

      return;
    }

    modal.classList.remove(className);
  };

  const renderToolbar = ({ nodes }: ImageRenderToolbarProps) => [
    nodes.prev,
    nodes.next,
    h(SvgIcon, {
      icon: `theme/${bgHide.value ? 'light' : 'dark'}`,
      onClick: () => onToggleBg(),
    }),
    nodes.zoomIn,
    nodes.zoomOut,
    nodes.resizeToOriginalSize,
    nodes.close,
  ];
</script>

<template>
  <n-image-group :render-toolbar="renderToolbar">
    <div
      class="gallery-lightbox"
      :class="$style.lightbox"
    >
      <n-image
        v-if="preview"
        :img-props="{ class: $style.image }"
        :alt
        lazy
      >
        <template #placeholder>
          <img
            :class="$style.image"
            src="/img/no-img.webp"
            alt="no-image"
          />
        </template>
      </n-image>

      <n-image
        v-for="(img, i) in images"
        v-show="!i && !preview"
        :key="img"
        :img-props="{ class: $style.image }"
        :src="img"
        :alt
        lazy
      >
        <template #placeholder>
          <img
            :class="$style.image"
            src="/img/no-img.webp"
            alt="no-image"
          />
        </template>
      </n-image>

      <img
        v-if="!images.length && !preview"
        :class="$style.image"
        src="/img/no-img.webp"
        alt="no-image"
      />
    </div>
  </n-image-group>
</template>

<style module lang="scss">
  .lightbox {
    cursor: pointer;

    position: relative;

    float: right;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    width: 200px;
    height: 200px;
    margin: 0 0 32px 32px;

    border-radius: 50%;

    .image {
      width: 100%;
      height: 100%;
    }

    @media (max-width: 1400px) {
      width: 180px;
      height: 180px;
    }

    @media (max-width: 500px) {
      width: 120px;
      height: 120px;
      margin: 0 0 16px 16px;
    }
  }
</style>
