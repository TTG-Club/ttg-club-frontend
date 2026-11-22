<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { EffectFlagMenuGroup } from '../../model';

  import {
    ACTIVE_EFFECT_LABELS,
    DEFAULT_EFFECT_FLAG,
    EFFECT_FLAG_LABELS,
    EFFECT_FLAG_MENU,
    EFFECT_FLAG_OPTIONS,
    EFFECT_MODIFIERS_STEP_LABELS,
  } from '../../model';
  import EffectLibraryInput from './EffectLibraryInput.vue';

  const model = defineModel<Array<string>>({ default: () => [] });

  function addFlag() {
    model.value = [...model.value, DEFAULT_EFFECT_FLAG];
  }

  /**
   * Добавляет флаг по готовому пункту меню. Уже стоящий флаг молча
   * пропускается: список флагов — набор, повторная запись ничего не добавляет,
   * а в блоке выглядела бы дублем.
   *
   * @param flag ключ флага из меню.
   */
  function addFlagFromMenu(flag: string) {
    if (model.value.includes(flag)) {
      return;
    }

    model.value = [...model.value, flag];
  }

  /**
   * Разворачивает раздел меню в пункт: у защит от урона внутри лежат свои
   * разделы (сопротивление, иммунитет, уязвимость), у остальных — сразу флаги.
   *
   * @param group раздел меню флагов.
   * @returns пункт выпадающего меню со вложенным списком.
   */
  function toFlagMenuItem(group: EffectFlagMenuGroup): DropdownMenuItem {
    const nested = group.groups?.map(toFlagMenuItem) ?? [];

    return {
      label: group.label,
      children: [
        ...nested,
        ...group.items.map((item) => ({
          label: item.label,
          onSelect: () => addFlagFromMenu(item.key),
        })),
      ],
    };
  }

  const flagMenuItems = computed<Array<Array<DropdownMenuItem>>>(() =>
    EFFECT_FLAG_MENU.map((group) => [toFlagMenuItem(group)]),
  );

  function removeFlag(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  function updateFlag(index: number, value: string) {
    model.value = model.value.map((flag, position) =>
      position === index ? value : flag,
    );
  }

  function getFlagLabel(flag: string): string | undefined {
    return EFFECT_FLAG_LABELS[flag];
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">
        {{ EFFECT_MODIFIERS_STEP_LABELS.flagsTitle }}
      </span>

      <div class="flex items-center gap-1">
        <UDropdownMenu
          :items="flagMenuItems"
          :content="{ align: 'end' }"
          :ui="{ content: 'max-h-96 overflow-y-auto' }"
        >
          <UButton
            icon="tabler:list-search"
            size="xs"
            variant="soft"
            :title="EFFECT_MODIFIERS_STEP_LABELS.flagPresetHint"
          >
            {{ EFFECT_MODIFIERS_STEP_LABELS.presets }}
          </UButton>
        </UDropdownMenu>

        <UButton
          icon="tabler:plus"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="addFlag"
        >
          {{ ACTIVE_EFFECT_LABELS.addRow }}
        </UButton>
      </div>
    </div>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ EFFECT_MODIFIERS_STEP_LABELS.flagsEmpty }}
    </p>

    <div
      v-for="(flag, index) in model"
      :key="index"
      class="flex flex-col gap-1 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <div class="flex items-center gap-2">
        <EffectLibraryInput
          :model-value="flag"
          :options="EFFECT_FLAG_OPTIONS"
          :placeholder="ACTIVE_EFFECT_LABELS.flagPlaceholder"
          @update:model-value="updateFlag(index, $event)"
        />

        <UButton
          icon="tabler:trash"
          color="error"
          variant="soft"
          :aria-label="ACTIVE_EFFECT_LABELS.flagRemove"
          @click.left.exact.prevent="removeFlag(index)"
        />
      </div>

      <span
        v-if="getFlagLabel(flag)"
        class="text-xs text-muted italic"
      >
        {{ getFlagLabel(flag) }}
      </span>

      <span
        v-else-if="flag"
        class="text-xs text-warning/80 italic"
      >
        {{ ACTIVE_EFFECT_LABELS.flagUnknown }}
      </span>
    </div>
  </div>
</template>
