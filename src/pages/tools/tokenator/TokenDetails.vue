<script lang="ts" setup>
  import { ref } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import type { TButtonOption } from '@/shared/ui/kit/button/UiButton';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiSlider from '@/shared/ui/kit/slider/UiSlider.vue';

  import { useTokenator } from '@/pages/tools/tokenator/composable';

  const showFrames = ref(false);

  const {
    open,
    loadFile,
    file,
    tokenFrames,
    reflectImage,
    centerImage,
    scale,
    scaleConfig,
    MAX_SIZE,
    MAX_DIMENSION,
  } = useTokenator();

  const variants: Array<TButtonOption> = [
    {
      key: 'webp',
      label: 'WEBP',
      callback: () => loadFile('webp'),
    },
    {
      key: 'png',
      label: 'PNG',
      callback: () => loadFile('png'),
    },
  ];
</script>

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

      <div :class="$style['token-container']">
        <div :class="$style['token-wrapper']">
          <div :class="[$style.common, $style['token-details']]">
            <svg-icon
              icon="no-frame"
              size="24px"
            />

            <span :class="$style['token-details-text']">Без Рамки</span>
          </div>

          <div
            :class="[$style.common, $style['token-action']]"
            @click="showFrames = !showFrames"
          >
            <svg-icon
              icon="arrow/down"
              size="24px"
            />
          </div>
        </div>

        <div
          v-if="showFrames"
          :class="$style['token-option-container']"
        >
          <div
            v-for="(frame, index) in tokenFrames"
            :key="frame.id"
          >
            <div
              v-if="index === 0"
              :class="$style['token-option']"
            >
              <svg-icon
                icon="no-frame"
                size="24px"
              />

              <span :class="$style['token-option-text']">Без Рамки</span>
            </div>

            <div
              v-else
              :class="$style['token-option']"
            >
              <img
                :class="$style['token-option-img']"
                :src="frame.url"
                alt="token-frame"
              />

              <span :class="$style['token-option-text']"
                >Рамка {{ index }}</span
              >
            </div>
          </div>
        </div>
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
          @click.left.exact.prevent="loadFile('png')"
        >
          Скачать
        </ui-button>
      </div>
    </div>
  </div>
</template>

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

  .token-container {
    position: relative;
  }

  .token-wrapper {
    display: flex;
    flex: 1;
    align-items: center;
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-top: 24px;
    overflow: hidden;
  }

  .common {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 0;
  }

  .token-details {
    flex: 0.9;
  }

  .token-details-text {
    margin-left: 8px;
  }

  .token-action {
    flex: 0.1;
    &:hover {
      background-color: var(--hover);
    }
  }

  .token-option-container {
    position: absolute;
    border: 1px solid var(--border);
    margin-top: 4px;
    padding: 8px;
    border-radius: 8px;
    background-color: var(--bg-secondary);
    z-index: 9;
    width: 100%;
  }
  .token-option {
    display: flex;
    align-items: center;
    flex: 1;
    padding: 10px;
    &:hover {
      background-color: var(--hover);
    }
  }

  .token-option-img {
    width: 24px;
    height: 24px;
  }

  .token-option-text {
    margin-left: 8px;
    font-size: var(--main-font-size);
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
