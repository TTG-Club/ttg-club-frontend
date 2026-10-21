<script setup lang="ts">
  import type { EntrySource } from '../model';

  import { SOURCE_BADGE_CLASSES } from '../model';

  /**
   * Метка группы источника в строке списка: официальный, тестовый,
   * сторонний материал или хомбрю. Полное название группы — в подсказке.
   */
  const { group } = defineProps<{
    group: NonNullable<EntrySource['group']>;
  }>();

  const styles = useCssModule();

  const badgeClass = computed(() => {
    const variant = SOURCE_BADGE_CLASSES[group.shortName.toLowerCase()];

    return [styles.badge, variant ? styles[variant] : undefined];
  });
</script>

<template>
  <UTooltip :text="group.name">
    <span :class="badgeClass">{{ group.shortName }}</span>
  </UTooltip>
</template>

<style lang="scss" module>
  /* Цвета групп — те же переменные темы, что у меток старого SPA */
  .badge {
    flex-shrink: 0;

    padding: 0 6px;
    border: 1px solid var(--border);
    border-radius: 20px;

    font-size: 12px;
    color: var(--text-color);

    background: var(--bg-table-list);
  }

  .homebrew {
    background: var(--badge-hb);
  }

  .thirdParty {
    background: var(--badge-3rd);
  }
</style>
