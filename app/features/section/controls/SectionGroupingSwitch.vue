<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { SectionGroupingOption } from '../model';

  import { SECTION_TEXT } from '../model';

  /**
   * Переключатель группировки списка под поиском: например, снаряжение по
   * категориям или по алфавиту.
   */
  const { options } = defineProps<{
    options: Array<SectionGroupingOption>;
  }>();

  const grouping = defineModel<string>({ required: true });

  const items = computed<Array<TabsItem>>(() =>
    options.map(({ value, label, icon }) => ({ value, label, icon })),
  );

  /**
   * Вкладки отдают значение строкой или числом, а группировка — строка.
   * @param value - выбранная вкладка
   */
  function select(value: string | number) {
    grouping.value = String(value);
  }
</script>

<template>
  <UTabs
    :model-value="grouping"
    :items="items"
    :content="false"
    :aria-label="SECTION_TEXT.grouping"
    size="sm"
    color="neutral"
    class="w-full"
    @update:model-value="select"
  />
</template>
