<template>
  <page-layout :use-social-links="false">
    <template #title> Токенатор </template>

    <template #default>
      <div :class="$style.container">
        <token-details>
          <template #slider>
            <ui-slider
              v-model="scale"
              :min="0.1"
              :max="2"
              :step="0.05"
            />
          </template>
        </token-details>

        <token-stamp />
      </div>
    </template>
  </page-layout>
</template>
<script lang="ts" setup>
  import { useTokenator } from '@/pages/Tools/Tokenator/composable';

  import PageLayout from '@/layouts/PageLayout.vue';

  import UiSlider from '@/shared/ui/kit/slider/UiSlider.vue';

  import TokenDetails from './TokenDetails.vue';
  import TokenStamp from './TokenStamp.vue';

  const { scale } = useTokenator();
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
