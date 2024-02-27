<script lang="ts" setup>
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  import type { TokenFrames } from '@shared/types/tools/Tokenator.d';

  defineProps<{
    frames: TokenFrames;
    selectFrame: Function;
    toggleFramesDropdown: Function;
  }>();

  const emptyFrameName = 'пустой';
</script>

<template>
  <div
    v-if="frames.selectedFrame"
    :class="$style.container"
  >
    <div :class="$style.wrapper">
      <div
        v-if="frames.selectedFrame.name === emptyFrameName"
        :class="[$style.common, $style.details]"
      >
        <svg-icon
          icon="no-frame"
          size="24px"
        />

        <span :class="$style['details-text']">Без Рамки</span>
      </div>

      <div
        v-else
        :class="[$style.common, $style.details]"
      >
        <img
          :class="$style['option-img']"
          :src="frames.selectedFrame.url"
          alt="token-frame"
        />

        <span :class="$style['details-text']"
          >Рамка №{{ frames.selectedFrameIndex }}</span
        >
      </div>

      <div
        :class="[$style.common, $style.action]"
        @click.left.exact.prevent="toggleFramesDropdown()"
      >
        <svg-icon
          icon="arrow/down"
          size="24px"
        />
      </div>
    </div>

    <div
      v-if="frames.show"
      :class="$style['option-container']"
    >
      <div
        v-for="(frame, index) in frames.list"
        :key="frame.id"
      >
        <div
          v-if="frame.name === emptyFrameName"
          :class="$style.option"
          @click.left.exact.prevent="selectFrame(frame)"
        >
          <svg-icon
            icon="no-frame"
            size="24px"
          />

          <span :class="$style['option-text']">Без Рамки</span>
        </div>

        <div
          v-else
          :class="$style.option"
          @click.left.exact.prevent="selectFrame(frame)"
        >
          <img
            :class="$style['option-img']"
            :src="frame.url"
            alt="token-frame"
          />

          <span :class="$style['option-text']">Рамка №{{ index }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
  .container {
    position: relative;
  }

  .wrapper {
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

  .details {
    flex: 0.9;
  }

  .details-text {
    margin-left: 8px;
  }

  .action {
    flex: 0.1;
    &:hover {
      background-color: var(--hover);
      cursor: pointer;
    }
  }

  .option-container {
    position: absolute;
    border: 1px solid var(--border);
    margin-top: 4px;
    padding: 8px;
    border-radius: 8px;
    background-color: var(--bg-secondary);
    z-index: 9;
    width: 100%;
  }
  .option {
    display: flex;
    align-items: center;
    flex: 1;
    padding: 10px;
    &:hover {
      background-color: var(--hover);
      cursor: pointer;
    }
  }

  .option-img {
    width: 24px;
    height: 24px;
  }

  .option-text {
    margin-left: 8px;
    font-size: var(--main-font-size);
  }
</style>
