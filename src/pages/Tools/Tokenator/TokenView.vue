<template>
  <page-layout :use-social-links="false">
    <template #title> Токенатор </template>

    <template #default>
      <div :class="$style.container">
        <token-details
          :open-file="open"
          :download-file="download"
          :disabled="true"
        />

        <token-stamp :source="files && files[0]" />
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
    console.log('downloaded item');
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
