<script lang="ts" setup>
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import UiSlider from '@/shared/ui/kit/slider/UiSlider.vue';

  import { useTokenator } from '@/pages/tools/tokenator/composable';

  import type { MenuOption } from 'naive-ui';

  const {
    open,
    load,
    file,
    reflectImage,
    centerImage,
    scale,
    scaleConfig,
    MAX_SIZE,
    MAX_DIMENSION,
  } = useTokenator();

  const variants: Array<MenuOption> = [
    {
      key: 'webp',
      label: 'WEBP',
      props: {
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();

          load('webp');
        },
      },
    },
    {
      key: 'png',
      label: 'PNG',
      props: {
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();

          load('png');
        },
      },
    },
  ];
</script>

<template>
  <div :class="$style.wrapper">
    <div :class="$style.header">Описание</div>

    <div :class="$style.text">
      <p>Вес загружаемой картинки не более {{ MAX_SIZE }}&nbsp;MB</p>

      <p>
        Размер картинки не должен превышать {{ MAX_DIMENSION }}px на
        {{ MAX_DIMENSION }}px
      </p>
    </div>

    <n-flex
      :style="{ marginTop: '42px' }"
      align="flex-end"
    >
      <ui-slider
        v-model="scale"
        v-bind="scaleConfig"
        :class="$style.slider"
      />

      <n-tooltip>
        <template #trigger>
          <n-button
            :disabled="!file"
            @click.left.exact.prevent="reflectImage = !reflectImage"
          >
            <template #icon>
              <svg-icon icon="reflect" />
            </template>
          </n-button>
        </template>

        <template #default> Зеркальное отображение </template>
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button
            :disabled="!file"
            @click.left.exact.prevent="centerImage = !centerImage"
          >
            <template #icon>
              <svg-icon icon="centerAxis" />
            </template>
          </n-button>
        </template>

        <template #default> Центрировать изображение </template>
      </n-tooltip>
    </n-flex>

    <n-flex
      :class="$style.buttons"
      :style="{ marginTop: '24px' }"
    >
      <n-button
        block
        secondary
        @click.left.exact.prevent="open"
      >
        Загрузить картинку
      </n-button>

      <n-button-group :style="{ width: '100%' }">
        <n-button
          type="primary"
          :disabled="!file"
          :style="{ flex: '1 1 auto' }"
          @click.left.exact.prevent="load('png')"
        >
          Скачать
        </n-button>

        <n-dropdown
          :options="variants"
          trigger="click"
        >
          <n-button
            type="primary"
            :disabled="!file"
          >
            <template #icon>
              <svg-icon icon="arrow/down" />
            </template>
          </n-button>
        </n-dropdown>
      </n-button-group>
    </n-flex>
  </div>
</template>

<style lang="scss" module>
  .wrapper {
    margin-top: 24px;
    padding: 24px;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 16px;

    @include media-min($md) {
      transform: none;
      margin: 0 24px 0 0;
    }
  }

  .header {
    font-size: var(--h4-font-size);
    font-weight: 600;
    line-height: 30px;
    color: var(--text-color-title);
  }

  .text {
    max-width: 290px;
    margin-top: 8px;
  }

  .slider {
    flex: 1 1 auto;
    margin-top: 8px;
  }
</style>
