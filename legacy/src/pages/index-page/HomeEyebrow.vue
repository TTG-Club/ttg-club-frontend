<script setup lang="ts">
  /**
   * Микро-подпись блока: моноширинный капс с широким трекингом. Единственный
   * вид заголовка второго уровня на главной.
   */
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  const props = withDefaults(
    defineProps<{
      /** Текст подписи, пишется как есть — регистр задаёт CSS */
      label: string;
      /** Необязательная иконка слева */
      icon?: string;
      /** Акцентный цвет — для подписей на тёмной картинке */
      accent?: boolean;
    }>(),
    {
      icon: undefined,
      accent: false,
    },
  );

  const rootClasses = computed(() => [
    'home-eyebrow',
    { 'home-eyebrow_accent': props.accent },
  ]);
</script>

<template>
  <span :class="rootClasses">
    <svg-icon
      v-if="icon"
      :icon="icon"
      :size="14"
      class="home-eyebrow__icon"
    />

    <span class="home-eyebrow__label">{{ label }}</span>
  </span>
</template>

<style lang="scss" scoped>
  .home-eyebrow {
    display: flex;
    gap: 6px;
    align-items: center;

    min-width: 0;

    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    color: var(--text-g-color);
    text-transform: uppercase;
    letter-spacing: 0.18em;

    &_accent {
      color: var(--link-color);
    }

    &__icon {
      flex-shrink: 0;
      color: var(--primary);
    }

    &__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
