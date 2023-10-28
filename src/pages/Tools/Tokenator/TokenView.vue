<template>
  <page-layout :use-social-links="false">
    <template #title> Токенатор </template>

    <template #default>
      <div :class="$style.container">
        <token-details
          :open-file="open"
          :download-file="downloadCanvas"
          :change-scale="changeScale"
        >
          <template #slider>
            <custom-slider
              v-model="scale"
              :min="0"
              :max="2"
              :step="0.1"
            />
          </template>
        </token-details>

        <token-stamp
          :source="files"
          :scale="scale"
        />
      </div>
    </template>
  </page-layout>
</template>
<script lang="ts" setup>
  import { useFileDialog } from '@vueuse/core';
  import { ref } from 'vue';

  import PageLayout from '@/layouts/PageLayout.vue';

  import { downloadCanvas } from '@/shared/helpers/downloadCanvas';
  import CustomSlider from '@/shared/ui/CustomSlider.vue';

  import TokenDetails from './TokenDetails.vue';
  import TokenStamp from './TokenStamp.vue';

  const scale = ref<number>(1);

  const { files, open } = useFileDialog({
    accept: 'image/*',
    multiple: false
  });
</script>

<style lang="scss" module>
  .container {
    display: flex;
    background: url('./assets/bg.png') no-repeat;
    width: 100%;
    height: 100%;
    padding: 50px 0;
  }
</style>
