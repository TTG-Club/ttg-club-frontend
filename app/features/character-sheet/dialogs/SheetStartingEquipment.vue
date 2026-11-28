<script setup lang="ts">
  import type { StartingEquipmentLine } from '../model';

  import { STARTING_EQUIPMENT_TEXT } from '../model';

  /**
   * Выбор стартового снаряжения в итоге мастера: строки с вариантами «а) …
   * или б) …» — переключателем, строки без выбора — списком. Снаряжение
   * можно не брать вовсе.
   */
  const { lines, gold = 0 } = defineProps<{
    lines: Array<StartingEquipmentLine>;
    /** Стартовые деньги, зм. */
    gold?: number;
  }>();

  const choices = defineModel<Array<number>>('choices', { required: true });
  const isEnabled = defineModel<boolean>('enabled', { required: true });

  const rows = computed(() =>
    lines.map((line, index) => ({
      key: index,
      items: line.options.map((option, optionIndex) => ({
        value: optionIndex,
        label: option.label,
      })),
      label: line.options[0]?.label ?? '',
      hasChoice: line.options.length > 1,
    })),
  );

  /**
   * Выбирает вариант строки.
   * @param index - строка
   * @param value - вариант
   */
  function choose(index: number, value: unknown): void {
    const next = [...choices.value];

    next[index] = Number(value) || 0;
    choices.value = next;
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <UCheckbox
      v-model="isEnabled"
      :label="STARTING_EQUIPMENT_TEXT.add"
    />

    <template v-if="isEnabled">
      <p
        v-if="lines.length"
        class="text-xs text-muted"
      >
        {{ STARTING_EQUIPMENT_TEXT.hint }}
      </p>

      <ul class="flex flex-col gap-2">
        <li
          v-for="row in rows"
          :key="row.key"
          class="rounded-lg border border-default p-2"
        >
          <URadioGroup
            v-if="row.hasChoice"
            :model-value="choices[row.key] ?? 0"
            :items="row.items"
            size="sm"
            @update:model-value="choose(row.key, $event)"
          />

          <span
            v-else
            class="text-sm"
          >
            {{ row.label }}
          </span>
        </li>
      </ul>

      <p
        v-if="gold > 0"
        class="text-sm font-medium"
      >
        {{ STARTING_EQUIPMENT_TEXT.gold(gold) }}
      </p>
    </template>
  </div>
</template>
