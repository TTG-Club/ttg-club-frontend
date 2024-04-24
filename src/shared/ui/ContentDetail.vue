<script lang="ts" setup>
  import { watch } from 'vue';

  import { useRollStore } from '../stores/RollStore';

  const props = defineProps<{
    entityName?: string;
  }>();

  const rollStore = useRollStore();

  watch(
    () => props.entityName,
    (name) => {
      rollStore.setFallbackSource(name);
    },
    { immediate: true },
  );
</script>

<template>
  <div class="content-detail">
    <div class="content-detail__fixed">
      <slot name="fixed" />
    </div>

    <div class="content-detail__body">
      <slot name="default" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .content-detail {
    display: flex;
    flex-direction: column;
    height: 100%;

    &__fixed,
    &__body {
      width: 100%;
      display: block;
    }

    &__fixed {
      flex-shrink: 0;
    }

    &__body {
      overflow: auto;
      flex: 1 1 100%;
    }
  }
</style>
