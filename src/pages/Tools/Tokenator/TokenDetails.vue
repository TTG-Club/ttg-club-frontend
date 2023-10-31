<template>
  <div :class="$style.wrapper">
    <div :class="$style.header">Описание</div>

    <div :class="$style.text_container">
      <span :class="$style.text">Вес загружаемой картинки не более 50mb</span>

      <span :class="$style.text">
        Размер картинки не должен превышать 2000px на 2000px
      </span>
    </div>

    <div :class="$style.handlers">
      <div :class="$style['resize-container']">
        <span :class="$style.icon">
          <svg-icon icon="zoom/out" />
        </span>

        <div :class="$style['slider-container']">
          <slot name="slider" />
        </div>

        <span :class="$style.icon">
          <svg-icon icon="zoom/in" />
        </span>
      </div>

      <div :class="$style.buttons">
        <ui-button
          type="outline"
          :body-class="$style.button"
          @click.left.exact.prevent="open"
        >
          Загрузить картинку
        </ui-button>

        <ui-button
          type="default"
          split
          :disabled="!file"
          :options="variants"
          @click.left.exact.prevent="load('png')"
        >
          Скачать
        </ui-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useTokenator } from '@/pages/Tools/Tokenator/composable';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import type { TButtonOption } from '@/shared/ui/kit/button/UiButton';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  const { open, load, file } = useTokenator();

  const variants: Array<TButtonOption> = [
    {
      key: 'webp',
      label: 'WEBP',
      callback: () => load('webp')
    },
    {
      key: 'png',
      label: 'PNG',
      callback: () => load('png')
    }
  ];
</script>

<style lang="scss" module>
  .wrapper {
    border-radius: 16px;
    padding: 24px;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    width: fit-content;
    height: fit-content;
    transform: translateY(-45%);

    @include media-min($md) {
      margin: 0;
      transform: none;
    }
  }

  .header {
    font-family: 'Open Sans', sans-serif;
    font-weight: 600;
    font-size: var(--h4-font-size);
    color: var(--text-color-title);
    line-height: 30px;
  }

  .text_container {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 290px;
  }

  .text {
    font-family: 'Open Sans', sans-serif;
    font-size: var(--main-font-size);
    line-height: 19px;
  }

  .handlers {
    margin-top: 42px;
  }

  .resize-container {
    display: flex;
    justify-content: space-between;
  }

  .slider-container {
    width: 80%;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin: -3px;
  }

  .buttons {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
  }

  .button {
    color: var(--text-color-title);
  }
</style>
