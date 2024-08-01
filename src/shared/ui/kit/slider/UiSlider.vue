<script lang="ts" setup>
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  const modelValue = defineModel<number>({ required: true });

  const props = withDefaults(
    defineProps<{
      min?: number;
      max?: number;
      step?: number;
    }>(),
    {
      min: 0.1,
      max: 2,
      step: 0.05,
    },
  );

  const { min, max, step } = toRefs(props);
</script>

<template>
  <n-flex
    :wrap="false"
    align="center"
  >
    <n-button
      quaternary
      @click.left.exact.prevent="modelValue -= step"
    >
      <template #icon>
        <svg-icon icon="zoom/out" />
      </template>
    </n-button>

    <n-slider
      v-model:value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      show-tooltip
    />

    <n-button
      quaternary
      @click.left.exact.prevent="modelValue += step"
    >
      <template #icon>
        <svg-icon icon="zoom/in" />
      </template>
    </n-button>
  </n-flex>
</template>
