<script lang="ts" setup>
  // TODO: Rename component

  import { storeToRefs } from 'pinia';
  import { ref, watch, nextTick, onMounted } from 'vue';

  import { useRollStore } from '@/shared/stores/RollStore';

  import ClearButton from './ClearButton.vue';
  import DiceHistoryInput from './DiceHistoryInput.vue';
  import DiceHistoryItem from './DiceHistoryItem.vue';

  const content = ref<HTMLElement>();

  const rollStore = useRollStore();
  const { rollsSortedByDate } = storeToRefs(rollStore);

  const scrollDown = () => {
    nextTick(() => {
      content.value?.scrollTo(0, content.value?.scrollHeight);
    });
  };

  watch(rollsSortedByDate, () => {
    scrollDown();
  });

  onMounted(() => {
    scrollDown();
  });
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
        v-for="roll in rollsSortedByDate"
        :key="roll.id"
        v-bind="roll"
      />
    </div>

    <div class="history__input">
      <dice-history-input @roll="scrollDown()" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
</style>
