<script setup lang="ts">
  import type { EntrySource } from '../model';

  import { SOURCE_BADGE_CLASSES } from '../model';

  /**
   * Метка источника в строке списка, цветом его группы: официальный,
   * тестовый, сторонний материал или хомбрю. Без подписи показывает саму
   * группу, с подписью — например, сокращение книги.
   */
  const {
    group,
    label = undefined,
    tooltip = undefined,
  } = defineProps<{
    group: NonNullable<EntrySource['group']>;
    /** Текст метки вместо сокращения группы. */
    label?: string;
    /** Подсказка вместо названия группы. */
    tooltip?: string;
  }>();

  const text = computed(() => label ?? group.shortName);

  const hint = computed(() => tooltip ?? group.name);

  const styles = useCssModule();

  const badgeClass = computed(() => {
    const variant = SOURCE_BADGE_CLASSES[group.shortName.toLowerCase()];

    return [styles.badge, variant ? styles[variant] : undefined];
  });
</script>

<template>
  <UTooltip :text="hint">
    <span :class="badgeClass">{{ text }}</span>
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
