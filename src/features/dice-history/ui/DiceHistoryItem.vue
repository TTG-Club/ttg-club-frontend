<script lang="ts" setup>
  import dayjs from 'dayjs';
  import { type GroupedRollBase, type RollBase } from 'dice-roller-parser';
  import { computed } from 'vue';

  import { isCritical, RollRenderer, type RollType } from '@/shared/utils/roll';

  const props = defineProps<{
    roll: GroupedRollBase | RollBase;
    type?: RollType;
    source?: string;
    label?: string;
    date: string;
  }>();

  const type = computed(() => {
    if (isCritical(props.roll, 'success')) {
      return 'success';
    }

    if (isCritical(props.roll, 'failure')) {
      return 'failure';
    }

    return 'normal';
  });

  const description = computed(
    () =>
      `${props.label || ''}${RollRenderer.getLabelSuffix(
        props.roll,
        props.type,
      )}`,
  );
</script>

<template>
  <div class="roll">
    <div
      class="roll__result"
      :class="`roll__result--type-${type}`"
    >
      {{ roll.value }}
    </div>

    <div class="roll__content">
      <div class="roll__title">{{ source }}</div>

      <div class="roll__description">
        <div class="roll__description-text">
          {{ description }}
          <component :is="RollRenderer.render(roll)" />
        </div>

        <div class="roll__time">
          {{ dayjs(date).format('HH:mm') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .roll {
    $root: &;

    display: flex;
    gap: 8px;
    padding: 4px 8px;
    font-size: 16px;

    &__result {
      flex: 2.1ch 0 0;
      font-size: var(--h2-font-size);
      line-height: var(--h2-font-size);
      color: var(--text-color-title);
      text-align: center;

      &--type {
        &-success {
          color: var(--bg-advantage);
        }

        &-failure {
          color: red;
        }
      }
    }

    &__content {
      flex: auto;
    }

    &__title {
      color: var(--text-color);
    }

    &__description {
      display: flex;
      gap: 2px;
      font-size: 0.7em;
      color: var(--text-g-color);
    }

    &__description-text {
      flex: auto;
      text-wrap: wrap;
      word-break: break-all;
    }

    &__time {
      flex: none;
      align-self: end;
    }
  }
</style>
