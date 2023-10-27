<template>
  <page-layout :use-social-links="false">
    <template #title> Токенатор </template>

    <template #default>
      <div :class="$style.container">
        <token-details
          :open-file="open"
          :download-file="download"
        />

        <token-stamp
          :source="files && files[0]"
          :download="download"
        />
      </div>
    </template>
  </page-layout>
</template>
<script lang="ts" setup>
  import { useFileDialog } from '@vueuse/core';

  import PageLayout from '@/layouts/PageLayout.vue';

  import TokenDetails from './TokenDetails.vue';
  import TokenStamp from './TokenStamp.vue';

  const { files, open } = useFileDialog({
    accept: 'image/*',
    multiple: false
  });

  const download = () => {
    const canvas = document.getElementById('canvasToken') as HTMLCanvasElement;

    if (canvas) {
      const canvasDataUrl = canvas.toDataURL('image/webp');

      const a = document.createElement('a');

      a.href = canvasDataUrl;
      a.download = 'token.webp';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
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
