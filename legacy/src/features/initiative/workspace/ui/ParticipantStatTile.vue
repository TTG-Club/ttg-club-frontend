<script setup lang="ts">
  const { label, accent = false } = defineProps<{
    /** Микро-подпись над значением («КД», «Бонус», «Иниц.»). */
    label: string;
    /** Акцентная (primary) плитка — для итога инициативы. */
    accent?: boolean;
  }>();
</script>

<!-- Плитка стата участника: все значения в строке (КД, бонус, итог
     инициативы) рендерятся в одинаковых «жетонах» одной высоты, чтобы ряд
     не распадался на разномастные контролы. -->
<template>
  <div
    class="stat-tile"
    :class="{ 'stat-tile--accent': accent }"
  >
    <span class="stat-tile__label">
      {{ label }}

      <slot name="label-icon" />
    </span>

    <div class="stat-tile__value">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
  .stat-tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;

    height: 44px;
    padding: 0 4px;

    background-color: var(--bg-sub-menu);
    border: 1px solid var(--border);
    border-radius: 8px;

    &--accent {
      background-color: color-mix(in srgb, var(--primary) 10%, transparent);
      border-color: var(--primary);
    }

    &__label {
      display: flex;
      gap: 2px;
      align-items: center;

      font-size: 10px;
      font-weight: 500;
      line-height: 1;
      color: var(--text-g-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    &--accent &__label {
      color: color-mix(in srgb, var(--primary) 70%, transparent);
    }

    &__value {
      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 14px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      color: var(--text-color-title);
    }

    &--accent &__value {
      color: var(--primary);
    }
  }
</style>
