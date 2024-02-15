<template>
  <div
    :class="{
      [$style.roll]: true
    }"
  >
    <div
      :class="{
        [$style.roll__result]: true,
        [$style['roll__result--success']]: isCritical(roll, 'success'),
        [$style['roll__result--failure']]: isCritical(roll, 'failure')
      }"
    >
      {{ roll.value }}
    </div>

    <div :class="$style.roll__content">
      <div :class="$style.roll__title">{{ source }}</div>

      <div :class="$style.roll__description">
        <div :class="$style['roll__description-text']">
          {{ description }}
          <component :is="DiceRollRenderer.render(roll)" />
        </div>

        <div :class="$style.roll__time">
          {{ dayjs(date).format('HH:mm') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import dayjs from 'dayjs';
  import { type GroupedRollBase, type RollBase } from 'dice-roller-parser';
  import { computed, useCssModule } from 'vue';

  import {
    isCritical,
    DiceRollRenderer,
    type TRollType
  } from '@/shared/helpers/roll';

  const $style = useCssModule();

  const props = defineProps<{
    roll: GroupedRollBase | RollBase;
    type?: TRollType;
    source?: string;
    label?: string;
    date: string;
  }>();

  const description = computed(
    () =>
      `${props.label || ''}${DiceRollRenderer.getLabelSuffix(
        props.roll,
        props.type
      )}`
  );
</script>

<style module lang="scss">
  @use '@/assets/styles/variables/colors' as *;

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
      text-align: center;
      color: var(--text-color-title);

      &--success {
        color: var(--bg-advantage);
      }

      &--failure {
        color: red;
      }
    }

    &__content {
      flex: auto;
    }

    &__title {
      color: var(--text-color);
    }

    &__description {
      color: var(--text-g-color);
      display: flex;
      gap: 2px;
      font-size: 0.7em;
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
