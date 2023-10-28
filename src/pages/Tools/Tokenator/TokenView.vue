<template>
  <page-layout :use-social-links="false">
    <template #title> Токенатор </template>

    <template #default>
      <div :class="$style.container">
        <token-details
          :open-file="open"
          :download-file="handleDownloadCanvas"
        >
          <template #slider>
            <custom-slider
              v-model="scale"
              :min="0"
              :max="2"
              :step="0.02"
            />
          </template>
        </token-details>

        <token-stamp
          :source="files"
          :scale="scale"
          :reset-scale="resetScale"
        />
      </div>
    </template>
  </page-layout>
</template>
<script lang="ts" setup>
  import { useFileDialog } from '@vueuse/core';
  import debounce from 'lodash-es/debounce';
  import { ref } from 'vue';

  import PageLayout from '@/layouts/PageLayout.vue';

  import { downloadCanvas } from '@/shared/helpers/downloadCanvas';
  import CustomSlider from '@/shared/ui/CustomSlider.vue';

  import TokenDetails from './TokenDetails.vue';
  import TokenStamp from './TokenStamp.vue';

  const DEFAULT_SCALE = 1;

  const scale = ref<number>(DEFAULT_SCALE);

  const { files, open } = useFileDialog({
    accept: 'image/*',
    multiple: false
  });

  const resetScale = () => {
    scale.value = DEFAULT_SCALE;
  };

  const handleDownloadCanvas = debounce(downloadCanvas, 300);
</script>

<style lang="scss" module>
  .container {
    display: flex;
    flex-direction: column-reverse;
    justify-content: center;
    align-items: center;

    @include media-min($md) {
      background: url('./assets/bg.png') no-repeat;
      flex-direction: row;
      justify-content: start;
      align-items: start;
      width: 100%;
      height: 100%;
      padding: 50px 0;
    }
  }
</style>
