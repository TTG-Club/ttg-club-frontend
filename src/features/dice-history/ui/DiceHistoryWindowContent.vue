<script lang="ts" setup>
  // TODO: Consider renaming the component

  import { ref, watch, onMounted, nextTick } from 'vue';

  import { useRollStore } from '@/shared/stores/RollStore';

  import ClearButton from './ClearButton.vue';
  import DiceHistoryInput from './DiceHistoryInput.vue';
  import DiceHistoryItem from './DiceHistoryItem.vue';

  const content = ref<HTMLElement>();

  const rollStore = useRollStore();

  watch(
    () => rollStore.rollsSortedByDate,
    () => {
      scrollDown();
    },
    { flush: 'post' },
  );

  onMounted(async () => {
    await nextTick();
    scrollDown();
  });

  function scrollDown() {
    content.value?.scrollTo(0, content.value?.scrollHeight);
  }
</script>

<template>
  <div class="history">
    <div class="history__heading">
      История бросков
      <clear-button @click="rollStore.clearRolls" />
    </div>

    <div
      ref="content"
      class="history__content"
    >
      <dice-history-item
        v-for="roll in rollStore.rollsSortedByDate"
        :key="roll.id"
        v-bind="roll"
      />
    </div>

    <div class="history__input">
      <dice-history-input />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .history {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
    padding: 8px 8px 0;
    background-color: var(--bg-sub-menu);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 1px 1px 0 rgb(0 0 0 / 25%);

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
      scrollbar-color: var(--text-g-color) var(--bg-sub-menu);
      border-bottom: 1px solid rgb(255 255 255 / 8%);

      &::-webkit-scrollbar {
        width: 6px;

        &-thumb {
          background: var(--text-g-color);
        }
      }
    }
  }
</style>
