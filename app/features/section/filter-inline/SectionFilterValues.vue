<script setup lang="ts">
  import type { BadgeProps } from '@nuxt/ui';

  import type { FilterValue } from '../model';

  /**
   * Значения группы фильтра метками, как на new.ttg.club: выбранная
   * залита акцентом, клик отмечает её или снимает отметку.
   */
  const {
    values,
    selected,
    size = 'lg',
    badgeClass = undefined,
  } = defineProps<{
    values: Array<FilterValue>;
    /** Выбранные ключи группы. */
    selected: Array<string>;
    size?: BadgeProps['size'];
    /** Дополнительные классы меток, например цвет текста. */
    badgeClass?: string;
  }>();

  const emit = defineEmits<{
    toggle: [key: string];
  }>();

  /**
   * Отмечено ли значение.
   * @param value - значение фильтра
   */
  function isSelected(value: FilterValue): boolean {
    return selected.includes(String(value.key));
  }

  /**
   * Вид метки: выбранная залита.
   * @param value - значение фильтра
   */
  function getVariant(value: FilterValue) {
    return isSelected(value) ? 'solid' : 'subtle';
  }

  /**
   * Цвет метки: выбранная — акцентная.
   * @param value - значение фильтра
   */
  function getColor(value: FilterValue) {
    return isSelected(value) ? 'primary' : 'neutral';
  }

  /**
   * Отмечает значение или снимает отметку.
   * @param value - значение фильтра
   */
  function toggle(value: FilterValue): void {
    emit('toggle', String(value.key));
  }
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <UTooltip
      v-for="value in values"
      :key="value.key"
      :text="value.tooltip"
      :disabled="!value.tooltip"
    >
      <UBadge
        :label="value.label"
        :variant="getVariant(value)"
        :color="getColor(value)"
        :aria-pressed="isSelected(value)"
        role="button"
        tabindex="0"
        :size="size"
        :class="badgeClass"
        class="max-w-full min-w-8 cursor-pointer justify-center rounded-md px-2 font-normal select-none hover:brightness-95"
        @click.left.exact.prevent="toggle(value)"
        @keydown.enter.prevent="toggle(value)"
        @keydown.space.prevent="toggle(value)"
      />
    </UTooltip>
  </div>
</template>
