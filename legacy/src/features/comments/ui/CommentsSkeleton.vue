<script setup lang="ts">
  const { rows = 3 } = defineProps<{
    /** Число строк-заглушек. */
    rows?: number;
  }>();
</script>

<template>
  <div class="comments-skeleton">
    <div
      v-for="row in rows"
      :key="row"
      class="comments-skeleton__row"
    >
      <n-skeleton
        circle
        size="small"
      />

      <div class="comments-skeleton__lines">
        <n-skeleton
          text
          width="40%"
        />

        <n-skeleton
          text
          width="100%"
        />

        <n-skeleton
          text
          width="66%"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .comments-skeleton {
    display: flex;
    flex-direction: column;
    gap: 20px;

    &__row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    &__lines {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      gap: 8px;
    }
  }
</style>
