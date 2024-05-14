<script lang="ts" setup>
  import dayjs from 'dayjs';
  import { type GroupedRollBase, type RollBase } from 'dice-roller-parser';
  import { computed } from 'vue';

  import { useClassName } from '@/shared/composables/useClassName';
  import { isCritical, RollRenderer, type RollType } from '@/shared/utils/roll';

  const cn = useClassName();

  const props = defineProps<{
    roll: GroupedRollBase | RollBase;
    type?: RollType;
    source?: string;
    label?: string;
    date: string;
  }>();

  const resultType = computed(() => {
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
  <div :class="cn()">
    <div :class="cn('result', { type: resultType })">
      {{ roll.value }}
    </div>

    <div :class="cn('content')">
      <div :class="cn('title')">{{ source }}</div>

      <div :class="cn('description')">
        <div :class="cn('description-text')">
          {{ description }}
          <component :is="RollRenderer.render(roll)" />
        </div>

        <div :class="cn('time')">
          {{ dayjs(date).format('HH:mm') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
  .dice-history-item {
    display: flex;
    gap: 8px;
    padding: 12px 8px;
    font-size: 16px;

    & + & {
      border-top: 1px solid var(--border);
    }

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
          color: var(--bg-disadvantage);
        }
      }
    }

    &__content {
      flex: auto;
    }

    &__title {
      color: var(--text-color);
      font-size: var(--main-font-size);
    }

    &__description {
      display: flex;
      gap: 2px;
      font-size: calc(var(--main-font-size) - 2px);
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
