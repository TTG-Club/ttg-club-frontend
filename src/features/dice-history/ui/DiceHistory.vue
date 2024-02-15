<script lang="ts" setup>
  import { ref, watch, nextTick, onMounted } from 'vue';

  import UiFab from '@/shared/ui/kit/button/UiFab.vue';

  import { useDiceHistory } from '../composables';

  import ClearButton from './ClearButton.vue';
  import DiceHistoryInput from './DiceHistoryInput.vue';
  import DiceHistoryItem from './DiceHistoryItem.vue';
  import DiceHistoryWindow from './DiceHistoryWindow.vue';

  const content = ref<HTMLElement>();

  const { isOpen, toggle, rolls, clear } = useDiceHistory();

  const scrollDown = () => {
    nextTick(() => {
      content.value?.scrollTo(0, content.value?.scrollHeight);
    });
  };

  watch(rolls.value, () => {
    scrollDown();
  });

  onMounted(() => {
    scrollDown();
  });
</script>

<template>
  <div class="dice-history">
    <transition name="popover-animation">
      <dice-history-window v-show="isOpen">
        <div class="history">
          <div class="history__heading">
            История бросков
            <clear-button @click="clear" />
          </div>

          <div
            ref="content"
            class="history__content"
          >
            <dice-history-item
              v-for="roll in rolls"
              :key="roll.id"
              v-bind="roll"
            />
          </div>

          <div class="history__input">
            <dice-history-input @roll="scrollDown()" />
          </div>
        </div>
      </dice-history-window>
    </transition>

    <ui-fab
      class="dice-history__fab"
      :icon="isOpen ? 'close' : 'dice/d20'"
      @click="toggle()"
    />
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/colors' as *;
  @use 'variables' as *;

  .dice-history {
    &__fab {
      position: fixed;
      right: $x-offset;
      bottom: $y-offset;
      z-index: 50;
    }
  }

  .history {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
    padding: 8px 8px 0 8px;
    background-color: var(--bg-sub-menu);
    box-shadow: 0px 1px 1px 0px rgb(0 0 0 / 25%);
    border: 1px solid var(--border);
    border-radius: 8px;

    &__heading {
      display: flex;
      justify-content: space-between;
      padding: 4px 8px 8px;
      line-height: 20px;
      color: var(--text-color-dark);
      border-bottom: 1px solid rgb(255 255 255 / 8%);
    }

    &__content {
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      align-items: end;
      overflow-y: auto;
      scrollbar-color: var(--text-g-color);
      border-bottom: 1px solid rgb(255 255 255 / 8%);

      &::-webkit-scrollbar {
        width: 6px;

        &-thumb {
          background: var(--text-g-color);
        }
      }
    }
  }

  .popover-animation {
    &-enter-from,
    &-leave-to {
      opacity: 0;
      transform: scale(0);
      z-index: -1;
    }

    &-enter-to,
    &-leave-from {
      opacity: 1;
      transform: scale(1);
      z-index: 111;
    }

    &-enter-active,
    &-leave-active {
      @include css_anim;
    }
  }
</style>
