<template>
  <page-layout :use-social-links="false">
    <template #title> Токенатор </template>

    <template #default>
      <div :class="$style.container">
        <token-details
          :open-file="open"
          :download-file="handleDownloadCanvas"
          :disabled="!file"
        >
          <template #slider>
            <ui-slider
              v-model="scale"
              :min="0.1"
              :max="2.1"
              :step="0.05"
            />
          </template>
        </token-details>

        <token-stamp
          :source="file"
          :scale="scale"
          :reset-scale="resetScale"
          :show-error="toast.error"
        />
      </div>
    </template>
  </page-layout>
</template>
<script lang="ts" setup>
  import { useFileDialog } from '@vueuse/core';
  import debounce from 'lodash-es/debounce';
  import { ref } from 'vue';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import PageLayout from '@/layouts/PageLayout.vue';

  import { downloadCanvas } from '@/shared/helpers/downloadCanvas';
  import UiSlider from '@/shared/ui/kit/slider/UiSlider.vue';

  import TokenDetails from './TokenDetails.vue';
  import TokenStamp from './TokenStamp.vue';

  const toast = useToast(ToastEventBus);

  const DEFAULT_SCALE = 1.1;
  const MAX_FILE_SIZE = 50; // размер в мегабайтах

  const scale = ref<number>(DEFAULT_SCALE);
  const file = ref<File | null>(null);

  const { open, onChange } = useFileDialog({
    accept: 'image/*',
    multiple: false
  });

  onChange((param: FileList | null) => {
    const fileItem = param?.[0] as File;
    const fileSize = fileItem.size / 1024 ** 2; // размер в мегабайтах

    if (fileSize >= MAX_FILE_SIZE) {
      toast.error('Используйте заклинание по уменьшению размер файла.');

      return;
    }

    file.value = fileItem;
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
      background: {
        image: var(--bg-token);
        repeat: no-repeat;
      }
      flex-direction: row;
      justify-content: start;
      align-items: start;
      width: 100%;
      height: 100%;
      padding: 50px 0;
    }
  }
</style>
