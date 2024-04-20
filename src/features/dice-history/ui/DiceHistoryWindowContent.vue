<script lang="ts" setup>
  // TODO: Consider renaming the component

  import { ref, watch, onMounted, nextTick } from 'vue';

  import { useClassName } from '@/shared/composables/useClassName';
  import { useRollStore } from '@/shared/stores/RollStore';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  import DiceHistoryInput from './DiceHistoryInput.vue';
  import DiceHistoryItem from './DiceHistoryItem.vue';

  const cn = useClassName();

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
  <div :class="cn()">
    <div :class="cn('heading')">
      История бросков

      <ui-button
        :tooltip="{ content: 'Очистить историю' }"
        icon="clear"
        type="text"
        color="text"
        size="sm"
        @click="rollStore.clearRolls"
      />
    </div>

    <div
      ref="content"
      :class="cn('content')"
    >
      <dice-history-item
        v-for="roll in rollStore.rollsSortedByDate"
        :key="roll.id"
        v-bind="roll"
      />
    </div>

    <div :class="cn('input')">
      <dice-history-input />
    </div>
  </div>
</template>

<style lang="scss" module>
  .dice-history-window-content {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
    background-color: var(--bg-sub-menu);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 1px 1px 0 rgb(0 0 0 / 25%);

    &__heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding: 4px 7px 3px 12px;
    }

    &__content {
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      align-items: end;
      overflow-y: auto;
      padding: 0 8px;
      scrollbar-color: var(--text-g-color) var(--bg-sub-menu);

      &::-webkit-scrollbar {
        width: 6px;

        &-thumb {
          background: var(--text-g-color);
        }
      }
    }

    &__input {
      border-top: 1px solid var(--border);
    }
  }
</style>
