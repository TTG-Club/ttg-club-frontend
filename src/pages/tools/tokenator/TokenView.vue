<script lang="ts" setup>
  import PageLayout from '@/layouts/PageLayout.vue';

  import TokenDetails from './TokenDetails.vue';
  import TokenStamp from './TokenStamp.vue';
</script>

<template>
  <page-layout>
    <template #title> Токенатор</template>

    <template #default>
      <div :class="$style.container">
        <div :class="$style.wrapper">
          <token-details />

          <token-stamp />
        </div>
      </div>
    </template>
  </page-layout>
</template>

<style lang="scss" module>
  .container {
    display: flex;
    justify-content: center;

    @include media-min($md) {
      justify-content: start;
      width: 100%;
      height: 100%;
      padding: 50px 0;
      background: {
        image: var(--bg-token);
        repeat: no-repeat;
      }
    }
  }

  .wrapper {
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    justify-content: center;

    width: fit-content;
    height: fit-content;

    @include media-min($md) {
      flex-direction: row;
      align-items: center;
      justify-content: start;
    }
  }
</style>
