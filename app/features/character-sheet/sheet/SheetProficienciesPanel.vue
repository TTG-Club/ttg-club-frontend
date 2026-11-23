<script setup lang="ts">
  import type { SheetProficiencies } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    SHEET_BODY_LABELS,
    SHEET_LABELS,
    SHEET_REVEAL_CONTROL_CLASS,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Владения группами: доспехи, оружие, инструменты и языки. Значки — то, что
   * выдали источники механики (журнал выдач); свой текст группы правится по
   * клику на заголовок и показывается рядом.
   */
  const { document, update, editControlClass } = useCharacterSheet();
  const { grantedProficiencies } = useSheetStats();

  const editedGroup = ref<keyof SheetProficiencies | null>(null);

  /** Группы владений: ключ совпадает у журнала выдач и своего текста. */
  const PROFICIENCY_GROUPS: ReadonlyArray<{
    key: keyof SheetProficiencies;
    title: string;
  }> = [
    { key: 'armor', title: SHEET_LABELS.armorProficiency },
    { key: 'weapons', title: SHEET_LABELS.weaponProficiency },
    { key: 'tools', title: SHEET_LABELS.toolProficiency },
    { key: 'languages', title: SHEET_LABELS.languages },
  ];

  const groups = computed(() =>
    PROFICIENCY_GROUPS.map((group) => ({
      ...group,
      granted: grantedProficiencies.value[group.key],
      manual: document.value.proficiencies[group.key],
      isEdited: editedGroup.value === group.key,
    })),
  );

  /**
   * Открывает правку текста группы.
   * @param key - группа
   */
  function toggleEdit(key: keyof SheetProficiencies): void {
    editedGroup.value = editedGroup.value === key ? null : key;
  }

  /**
   * Меняет свой текст группы.
   * @param key - группа
   * @param value - текст
   */
  function setManual(key: keyof SheetProficiencies, value: string): void {
    update((current) => ({
      ...current,
      proficiencies: { ...current.proficiencies, [key]: value },
    }));
  }
</script>

<template>
  <SheetPanel>
    <div class="flex flex-col gap-4 pt-2">
      <div
        v-for="group in groups"
        :key="group.key"
        class="flex flex-col gap-2"
      >
        <h4
          class="rounded-md bg-elevated text-[11px] font-bold tracking-wider text-highlighted uppercase"
        >
          <button
            type="button"
            class="group/header flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-accented/50"
            :aria-label="`${SHEET_BODY_LABELS.settings}: ${group.title}`"
            @click.left.exact.prevent="toggleEdit(group.key)"
          >
            <span class="leading-none">{{ group.title }}</span>

            <UIcon
              name="tabler:settings"
              class="size-3.5 shrink-0 text-primary opacity-0 transition-opacity group-hover/header:opacity-100 group-focus-visible/header:opacity-100"
              :class="[SHEET_REVEAL_CONTROL_CLASS, editControlClass]"
            />
          </button>
        </h4>

        <div
          v-if="group.granted.length || group.manual"
          class="flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="name in group.granted"
            :key="name"
            :label="name"
            color="neutral"
            variant="subtle"
            size="sm"
          />

          <span
            v-if="group.manual && !group.isEdited"
            class="text-xs text-toned"
          >
            {{ group.manual }}
          </span>
        </div>

        <span
          v-else-if="!group.isEdited"
          class="text-xs text-dimmed italic"
        >
          {{ SHEET_BODY_LABELS.proficienciesEmpty }}
        </span>

        <UTextarea
          v-if="group.isEdited"
          :model-value="group.manual"
          :placeholder="SHEET_BODY_LABELS.manualProficiencies"
          :rows="1"
          autoresize
          autofocus
          class="w-full"
          @update:model-value="setManual(group.key, String($event))"
        />
      </div>
    </div>
  </SheetPanel>
</template>
