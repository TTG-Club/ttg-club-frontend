<script setup lang="ts">
  /** Заглушка ленты до старта боя: круги-плейсхолдеры с крупным «текущим». */
  const SLOTS = [
    { key: 'l2', size: 48, opacity: 0.25 },
    { key: 'l1', size: 56, opacity: 0.5 },
    { key: 'c', size: 80, opacity: 1, current: true },
    { key: 'r1', size: 56, opacity: 0.5 },
    { key: 'r2', size: 48, opacity: 0.25 },
  ];
</script>

<template>
  <div class="reel-skeleton">
    <div
      class="reel-skeleton__row"
      aria-hidden="true"
    >
      <div
        v-for="slot in SLOTS"
        :key="slot.key"
        class="reel-skeleton__slot"
        :style="{ opacity: slot.opacity }"
      >
        <div
          class="reel-skeleton__ring"
          :class="{ 'reel-skeleton__ring--current': slot.current }"
          :style="{ width: `${slot.size}px`, height: `${slot.size}px` }"
        />

        <n-skeleton
          :width="48"
          :height="10"
          :sharp="false"
        />
      </div>
    </div>

    <!-- Подпись повторяет структуру подписи живой ленты, чтобы блок был
         той же высоты в подготовке и бою. -->
    <div class="reel-skeleton__caption">
      <span class="reel-skeleton__hint">Бой ещё не начался</span>

      <span class="reel-skeleton__title">Соберите отряд</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .reel-skeleton {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &__row {
      position: relative;

      overflow: hidden;
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: center;

      height: 176px;
    }

    &__slot {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }

    &__ring {
      background-color: var(--bg-sub-menu);
      border: 1px dashed var(--border);
      border-radius: 50%;

      &--current {
        background-color: color-mix(in srgb, var(--primary) 5%, transparent);
        border: 2px dashed color-mix(in srgb, var(--primary) 40%, transparent);
      }
    }

    &__caption {
      display: flex;
      flex-direction: column;
      gap: 2px;
      align-items: center;
    }

    &__hint {
      font-size: 12px;
      color: var(--text-g-color);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    &__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color-title);
    }
  }
</style>
