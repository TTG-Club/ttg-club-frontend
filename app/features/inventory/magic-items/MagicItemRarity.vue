<script setup lang="ts">
  import type { MagicItemRarity } from '../model';

  /**
   * Редкость предмета с цветной точкой: цвета те же переменные темы, что у
   * старого SPA. «Разная» редкость — переход от обычной к артефакту.
   */
  const { rarity } = defineProps<{
    rarity: MagicItemRarity;
  }>();

  const styles = useCssModule();

  const dotClass = computed(() => [styles.dot, styles[rarity.type]]);
</script>

<template>
  <span class="inline-flex items-center gap-1.5">
    <span :class="dotClass" />

    <span class="first-letter:uppercase">{{ rarity.name }}</span>
  </span>
</template>

<style lang="scss" module>
  .dot {
    flex-shrink: 0;

    width: 10px;
    height: 10px;
    border: 1px solid var(--border);
    border-radius: 50%;

    background: var(--border);
  }

  .common {
    background: var(--common);
  }

  .uncommon {
    background: var(--uncommon);
  }

  .rare {
    background: var(--rare);
  }

  .very-rare {
    background: var(--very-rare);
  }

  .legendary {
    background: var(--legendary);
  }

  .artifact {
    background: var(--artifact);
  }

  .varies {
    background: linear-gradient(90deg, var(--common) 10%, var(--artifact) 100%);
  }
</style>
