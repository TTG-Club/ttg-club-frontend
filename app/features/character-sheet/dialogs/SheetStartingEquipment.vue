<script setup lang="ts">
  import type { StartingEquipmentCategory } from '~character/model';

  import type { CatalogOption, StartingEquipmentLine } from '../model';

  import { omit } from 'es-toolkit';

  import { getEquipmentChoiceKey, STARTING_EQUIPMENT_TEXT } from '../model';
  import SheetEquipmentChoicePicker from './SheetEquipmentChoicePicker.vue';

  /**
   * Выбор стартового снаряжения в итоге мастера: строки с вариантами «а) …
   * или б) …» — переключателем, строки без выбора — списком. Снаряжение
   * можно не брать вовсе. Для позиций «на выбор» выбранного варианта
   * игрок выбирает предмет справочника из категории.
   */
  const { lines, gold = 0 } = defineProps<{
    lines: Array<StartingEquipmentLine>;
    /** Стартовые деньги, зм. */
    gold?: number;
  }>();

  const choices = defineModel<Array<number>>('choices', { required: true });
  const isEnabled = defineModel<boolean>('enabled', { required: true });

  const picks = defineModel<Record<string, CatalogOption>>('picks', {
    default: () => ({}),
  });

  const rows = computed(() =>
    lines.map((line, index) => ({
      key: index,
      items: line.options.map((option, optionIndex) => ({
        value: optionIndex,
        label: option.label,
      })),
      label: line.options[0]?.label ?? '',
      hasChoice: line.options.length > 1,
      choiceItems: getChoiceItems(line, index),
    })),
  );

  const hasCategoryChoices = computed(() =>
    rows.value.some((row) => row.choiceItems.length > 0),
  );

  /**
   * Позиции «на выбор» в выбранном варианте строки.
   * @param line - строка снаряжения
   * @param lineIndex - номер строки
   */
  function getChoiceItems(
    line: StartingEquipmentLine,
    lineIndex: number,
  ): Array<{
    key: string;
    category: StartingEquipmentCategory;
    label: string;
  }> {
    const optionIndex = choices.value[lineIndex] ?? 0;
    const option = line.options[optionIndex];

    return (option?.items ?? []).flatMap((item, itemIndex) =>
      item.category
        ? [
            {
              key: getEquipmentChoiceKey(lineIndex, optionIndex, itemIndex),
              category: item.category,
              label: item.name,
            },
          ]
        : [],
    );
  }

  /**
   * Ставит или снимает выбранную запись позиции «на выбор».
   * @param key - ключ позиции
   * @param option - запись справочника; пусто — выбор снят
   */
  function choosePick(key: string, option: CatalogOption | undefined): void {
    const rest = omit(picks.value, [key]);

    picks.value = option ? { ...rest, [key]: option } : rest;
  }

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

          <div
            v-if="row.choiceItems.length"
            class="mt-2 flex flex-col gap-2"
          >
            <SheetEquipmentChoicePicker
              v-for="choiceItem in row.choiceItems"
              :key="choiceItem.key"
              :model-value="picks[choiceItem.key]"
              :category="choiceItem.category"
              :label="choiceItem.label"
              @update:model-value="choosePick(choiceItem.key, $event)"
            />
          </div>
        </li>
      </ul>

      <p
        v-if="hasCategoryChoices"
        class="text-xs text-muted"
      >
        {{ STARTING_EQUIPMENT_TEXT.choiceHint }}
      </p>

      <p
        v-if="gold > 0"
        class="text-sm font-medium"
      >
        {{ STARTING_EQUIPMENT_TEXT.gold(gold) }}
      </p>
    </template>
  </div>
</template>
