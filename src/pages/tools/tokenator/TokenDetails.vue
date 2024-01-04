<template>
  <div :class="$style.wrapper">
    <div :class="$style.header">Описание</div>

    <div :class="$style.text_container">
      <p>Вес загружаемой картинки не более {{ MAX_SIZE }}&nbsp;MB</p>

      <p>
        Размер картинки не должен превышать {{ MAX_DIMENSION }}px на
        {{ MAX_DIMENSION }}px
      </p>
    </div>

    <div :class="$style.handlers">
      <div :class="$style['configuration-container']">
        <div :class="$style['resize-container']">
          <ui-slider
            v-model="scale"
            v-bind="scaleConfig"
          />
        </div>

        <ui-button
          v-tippy="{ content: 'Зеркальное отображение' }"
          type="outline"
          :body-class="$style.button"
          :disabled="!file"
          icon="reflect"
          @click.left.exact.prevent="reflectImage = !reflectImage"
        />

        <ui-button
          v-tippy="{ content: 'Центрировать изображение' }"
          type="outline"
          :body-class="$style.button"
          :disabled="!file"
          icon="centerAxis"
          @click.left.exact.prevent="centerImage = !centerImage"
        />
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
  import { useTokenator } from '@/pages/tools/tokenator/composable';

  import type { TButtonOption } from '@/shared/ui/kit/button/UiButton';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiSlider from '@/shared/ui/kit/slider/UiSlider.vue';

  const {
    open,
    load,
    file,
    reflectImage,
    centerImage,
    scale,
    scaleConfig,
    MAX_SIZE,
    MAX_DIMENSION
  } = useTokenator();

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
    margin-top: 24px;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);

    @include media-min($md) {
      margin: 0 24px 0 0;
      transform: none;
    }
  }

  .header {
    font-weight: 600;
    font-size: var(--h4-font-size);
    color: var(--text-color-title);
    line-height: 30px;
  }

  .text_container {
    margin-top: 8px;
    max-width: 290px;
  }

  .handlers {
    margin-top: 42px;
  }

  .resize-container {
    flex: 1 1 auto;
    margin: 0 8px 0 0;
  }

  .configuration-container {
    display: flex;
    align-items: center;
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
