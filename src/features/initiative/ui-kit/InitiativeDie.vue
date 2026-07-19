<script setup lang="ts">
  const { value = undefined, size = 'sm' } = defineProps<{
    value?: number;
    /** Размер «самоцвета»: `xs` — подготовка, `sm` — бой, `lg` — герой лендинга. */
    size?: 'xs' | 'sm' | 'lg';
  }>();

  const display = computed(() =>
    typeof value === 'number' ? String(value) : '—',
  );
</script>

<template>
  <div
    class="initiative-die"
    :class="`initiative-die--${size}`"
  >
    <div class="initiative-die__gem" />

    <span
      :key="display"
      class="initiative-die__value"
    >
      {{ display }}
    </span>
  </div>
</template>

<style scoped lang="scss">
  .initiative-die {
    position: relative;
    display: inline-grid;
    flex-shrink: 0;
    place-items: center;

    &--xs {
      width: 32px;
      height: 32px;
    }

    &--sm {
      width: 44px;
      height: 44px;
    }

    &--lg {
      width: 56px;
      height: 56px;
    }

    &__gem {
      position: absolute;
      inset: 0;

      background-color: color-mix(in srgb, var(--primary) 10%, transparent);
      border: 1px solid var(--primary);
      border-radius: 8px;
    }

    &__value {
      position: relative;

      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      color: var(--primary);
    }

    &--xs &__value {
      font-size: 12px;
    }

    &--sm &__value {
      font-size: 16px;
    }

    &--lg &__value {
      font-size: 24px;
    }

    @media (prefers-reduced-motion: no-preference) {
      &__value {
        animation: initiative-die-pop 450ms ease-out;
      }
    }
  }

  @keyframes initiative-die-pop {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }

    60% {
      transform: scale(1.2);
      opacity: 1;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
