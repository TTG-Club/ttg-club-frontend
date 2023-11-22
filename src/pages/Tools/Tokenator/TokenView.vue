<template>
  <page-layout :use-social-links="false">
    <template #title> Токенатор </template>

    <template #default>
      <div :class="$style.container">
        <div :class="$style.wrapper">
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
    justify-content: center;
    @include media-min($md) {
      background: {
        image: var(--bg-token);
        repeat: no-repeat;
      }
      justify-content: start;
      width: 100%;
      height: 100%;
      padding: 50px 0;
    }
  }
  .wrapper {
    display: flex;
    width: fit-content;
    height: fit-content;
    flex-direction: column-reverse;
    justify-content: center;
    align-items: center;
    @include media-min($md) {
      flex-direction: row;
      justify-content: start;
      align-items: center;
    }
  }
</style>
