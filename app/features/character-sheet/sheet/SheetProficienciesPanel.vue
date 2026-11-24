<script setup lang="ts">
  import type { SheetProficiencyGroup, SheetToolProficiency } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import { SheetProficiencyModal, SheetToolCheckModal } from '../dialogs';
  import {
    normalizeProficiencyName,
    SHEET_BODY_LABELS,
    SHEET_LABELS,
    SHEET_REVEAL_CONTROL_CLASS,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Владения группами: доспехи, оружие, инструменты и языки. Значки — то, что
   * выдали источники механики (журнал выдач), и свои записи игрока; шестерёнка
   * группы открывает окно владений. Клик по инструменту — проверка им.
   */
  const { document, ensureEditable, editControlClass } = useCharacterSheet();
  const { grantedProficiencies } = useSheetStats();

  const editedGroup = ref<SheetProficiencyGroup | null>(null);
  const isEditOpen = ref(false);

  const checkedTool = ref<SheetToolProficiency | null>(null);
  const isToolCheckOpen = ref(false);

  /** Группы владений: ключ совпадает у журнала выдач и своих записей. */
  const PROFICIENCY_GROUPS: ReadonlyArray<{
    key: SheetProficiencyGroup;
    title: string;
  }> = [
    { key: 'armor', title: SHEET_LABELS.armorProficiency },
    { key: 'weapons', title: SHEET_LABELS.weaponProficiency },
    { key: 'tools', title: SHEET_LABELS.toolProficiency },
    { key: 'languages', title: SHEET_LABELS.languages },
  ];

  /**
   * Записи группы: выданное и своё без повторов по названию. У своего
   * инструмента сохраняется запись справочника.
   * @param key - группа владений
   */
  function getEntries(key: SheetProficiencyGroup): Array<SheetToolProficiency> {
    const manual: Array<SheetToolProficiency> =
      key === 'tools'
        ? document.value.proficiencies.tools
        : document.value.proficiencies[key].map((name) => ({
            name,
            url: null,
          }));

    const seen = new Set<string>();

    return [
      ...grantedProficiencies.value[key].map((name) => ({ name, url: null })),
      ...manual,
    ].filter((entry) => {
      const normalized = normalizeProficiencyName(entry.name);

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);

      return true;
    });
  }

  const groups = computed(() =>
    PROFICIENCY_GROUPS.map((group) => ({
      ...group,
      entries: getEntries(group.key),
      isRollable: group.key === 'tools',
    })),
  );

  /**
   * Открывает окно владений группы.
   * @param key - группа
   */
  function openEdit(key: SheetProficiencyGroup): void {
    if (!ensureEditable()) {
      return;
    }

    editedGroup.value = key;
    isEditOpen.value = true;
  }

  /**
   * Открывает проверку инструментом.
   * @param tool - инструмент
   */
  function openToolCheck(tool: SheetToolProficiency): void {
    checkedTool.value = tool;
    isToolCheckOpen.value = true;
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
            @click.left.exact.prevent="openEdit(group.key)"
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
          v-if="group.entries.length"
          class="flex flex-wrap gap-1.5"
        >
          <template v-if="group.isRollable">
            <UButton
              v-for="entry in group.entries"
              :key="entry.name"
              :label="entry.name"
              color="neutral"
              variant="subtle"
              size="xs"
              icon="tabler:dice-5"
              @click.left.exact.prevent="openToolCheck(entry)"
            />
          </template>

          <template v-else>
            <UBadge
              v-for="entry in group.entries"
              :key="entry.name"
              :label="entry.name"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </template>
        </div>

        <span
          v-else
          class="text-xs text-dimmed italic"
        >
          {{ SHEET_BODY_LABELS.proficienciesEmpty }}
        </span>
      </div>
    </div>

    <SheetProficiencyModal
      v-model:open="isEditOpen"
      :group="editedGroup"
    />

    <SheetToolCheckModal
      v-model:open="isToolCheckOpen"
      :tool="checkedTool"
    />
  </SheetPanel>
</template>
