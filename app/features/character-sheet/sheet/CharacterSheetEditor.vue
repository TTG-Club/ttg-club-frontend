<script setup lang="ts">
  import type { SheetTab } from '../model';

  import {
    useCharacterSheet,
    useSheetClassData,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import {
    SheetCombatModal,
    SheetHealthModal,
    SheetLevelUpModal,
    SheetResourcesModal,
  } from '../dialogs';
  import {
    CHARACTER_SHEET_ROUTE,
    formatModifier,
    SHEET_BODY_LABELS,
    SHEET_ICON,
    SHEET_LABELS,
    SHEET_RIGHT_COLUMN_GAP,
    SHEET_TEXT,
    SHEET_WIDE_MIN_WIDTH,
  } from '../model';
  import SheetAbilities from './SheetAbilities.vue';
  import SheetDefencesPanel from './SheetDefencesPanel.vue';
  import SheetEffects from './SheetEffects.vue';
  import SheetExhaustionPanel from './SheetExhaustionPanel.vue';
  import SheetFeatures from './SheetFeatures.vue';
  import SheetHeader from './SheetHeader.vue';
  import SheetHealthPanel from './SheetHealthPanel.vue';
  import SheetInventory from './SheetInventory.vue';
  import SheetNotes from './SheetNotes.vue';
  import SheetPersonality from './SheetPersonality.vue';
  import SheetProficienciesPanel from './SheetProficienciesPanel.vue';
  import SheetResourcesPanel from './SheetResourcesPanel.vue';
  import SheetSavingThrowsPanel from './SheetSavingThrowsPanel.vue';
  import SheetSkillsPanel from './SheetSkillsPanel.vue';
  import SheetSpeedTile from './SheetSpeedTile.vue';
  import SheetSpells from './SheetSpells.vue';
  import SheetStatTile from './SheetStatTile.vue';
  import SheetTabs from './SheetTabs.vue';

  /**
   * Лист персонажа целиком, в раскладке new.ttg.club: шапка, слева — плитки
   * показателей, здоровье, истощение, спасброски, владения, защиты, ресурсы и
   * навыки; справа — ряд характеристик и вкладки снаряжения, заклинаний,
   * особенностей, эффектов, личности и заметок. На узком экране всё идёт
   * одной колонкой. Правки сохраняются сами.
   */
  const { id } = defineProps<{
    id: string;
  }>();

  const { loadStatus, name, load, ensureEditable } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollD20 } = useSheetRoll();

  // Механика классов грузится вместе с листом и живёт, пока он открыт
  useSheetClassData();

  const activeTab = ref<SheetTab>('inventory');
  const combatSection = ref<'armor' | 'speed' | null>(null);
  const isHealthOpen = ref(false);
  const isResourcesOpen = ref(false);

  const isCombatOpen = computed({
    get: () => combatSection.value !== null,
    set: (open: boolean) => {
      if (!open) {
        combatSection.value = null;
      }
    },
  });

  const proficiencyLabel = computed(() =>
    formatModifier(stats.value.proficiencyBonus),
  );

  const initiativeLabel = computed(() =>
    formatModifier(stats.value.initiative),
  );

  useSeoMeta({
    title: () => name.value || SHEET_TEXT.title,
  });

  watch(
    () => id,
    (next) => {
      if (next) {
        load(next);
      }
    },
    { immediate: true },
  );

  // Высота вкладок в широком режиме равна левой колонке без ряда
  // характеристик: трек `1fr` высоту не ограничивает, и длинный список
  // заклинаний раздувал бы правую колонку. Внутри вкладки прокручиваются
  const gridRef = useTemplateRef<HTMLElement>('grid');
  const leftColumnRef = useTemplateRef<HTMLElement>('leftColumn');
  const abilitiesRef = useTemplateRef<HTMLElement>('abilities');
  const { width: gridWidth } = useElementSize(gridRef);
  const { height: leftColumnHeight } = useElementSize(leftColumnRef);
  const { height: abilitiesHeight } = useElementSize(abilitiesRef);

  const tabsStyle = computed(() => {
    if (gridWidth.value < SHEET_WIDE_MIN_WIDTH || leftColumnHeight.value <= 0) {
      return undefined;
    }

    const maxHeight = Math.max(
      0,
      Math.round(
        leftColumnHeight.value - abilitiesHeight.value - SHEET_RIGHT_COLUMN_GAP,
      ),
    );

    return { maxHeight: `${maxHeight}px` };
  });

  function retry(): void {
    load(id);
  }

  function openArmor(): void {
    if (!ensureEditable()) {
      return;
    }

    combatSection.value = 'armor';
  }

  function openSpeed(): void {
    if (!ensureEditable()) {
      return;
    }

    combatSection.value = 'speed';
  }

  function openHealth(): void {
    isHealthOpen.value = true;
  }

  function openResources(): void {
    if (!ensureEditable()) {
      return;
    }

    isResourcesOpen.value = true;
  }

  /**
   * Бросок инициативы.
   * @param event - клик
   */
  function rollInitiative(event: MouseEvent): void {
    rollD20(SHEET_LABELS.initiative, stats.value.initiative, event, {
      kind: 'initiative',
    });
  }
</script>

<template>
  <div class="@container mx-auto flex w-full max-w-350 flex-col gap-4 p-4">
    <div
      v-if="loadStatus === 'pending' || loadStatus === 'idle'"
      class="flex flex-col gap-4"
    >
      <USkeleton class="h-24 w-1/2 rounded-lg" />

      <USkeleton class="h-24 w-full rounded-xl" />

      <USkeleton class="h-96 w-full rounded-xl" />
    </div>

    <UEmpty
      v-else-if="loadStatus === 'notFound'"
      :icon="SHEET_ICON.empty"
      :title="SHEET_TEXT.notFound"
      :description="SHEET_TEXT.notFoundDescription"
      variant="naked"
      class="py-16"
    >
      <template #actions>
        <UButton
          :label="SHEET_TEXT.backToList"
          :to="CHARACTER_SHEET_ROUTE"
        />
      </template>
    </UEmpty>

    <UEmpty
      v-else-if="loadStatus === 'error'"
      :icon="SHEET_ICON.empty"
      :title="SHEET_TEXT.sheetLoadFailed"
      variant="naked"
      class="py-16"
    >
      <template #actions>
        <UButton
          :label="SHEET_TEXT.retry"
          @click.left.exact.prevent="retry"
        />
      </template>
    </UEmpty>

    <template v-else>
      <SheetHeader />

      <div class="relative flex items-center justify-center py-1">
        <div
          class="h-px w-full bg-linear-to-r from-transparent via-primary/40 to-transparent"
        />

        <div
          class="absolute size-2 rotate-45 border border-primary bg-default"
        />
      </div>

      <div
        ref="grid"
        class="grid grid-cols-1 gap-4 @5xl:grid-cols-12 @5xl:grid-rows-[min-content_1fr]"
      >
        <div
          ref="abilities"
          class="@5xl:col-span-6 @5xl:col-start-7 @5xl:row-start-1"
        >
          <SheetAbilities />
        </div>

        <div
          ref="leftColumn"
          class="@5xl:col-span-6 @5xl:col-start-1 @5xl:row-span-2 @5xl:row-start-1 @5xl:self-start"
        >
          <div class="grid grid-cols-2 gap-4 max-sm:@md:grid-cols-4">
            <div class="flex flex-col gap-4 max-sm:contents">
              <div class="grid grid-cols-2 gap-4 max-sm:contents">
                <SheetStatTile
                  :label="SHEET_BODY_LABELS.proficiencyBonus"
                  :value="proficiencyLabel"
                />

                <SheetStatTile
                  :label="SHEET_BODY_LABELS.armorClass"
                  :short-label="SHEET_BODY_LABELS.armorClassShort"
                  :value="stats.armorClass"
                  interactive
                  :press-label="SHEET_BODY_LABELS.armorClassPress"
                  @press="openArmor"
                />
              </div>

              <SheetHealthPanel
                class="max-sm:order-1 max-sm:col-span-full"
                @edit="openHealth"
              />

              <SheetExhaustionPanel
                class="max-sm:order-2 max-sm:col-span-full"
              />

              <SheetSavingThrowsPanel
                class="max-sm:order-5 max-sm:col-span-full"
              />

              <SheetProficienciesPanel
                class="max-sm:order-6 max-sm:col-span-full"
              />

              <SheetDefencesPanel class="max-sm:order-7 max-sm:col-span-full" />
            </div>

            <div class="flex flex-col gap-4 max-sm:contents">
              <div class="grid grid-cols-2 gap-4 max-sm:contents">
                <SheetSpeedTile @edit="openSpeed" />

                <SheetStatTile
                  :label="SHEET_BODY_LABELS.initiative"
                  :value="initiativeLabel"
                  interactive
                  @press="rollInitiative"
                />
              </div>

              <SheetResourcesPanel
                class="max-sm:order-3 max-sm:col-span-full"
                @edit="openResources"
              />

              <SheetSkillsPanel
                class="grow max-sm:order-4 max-sm:col-span-full"
              />
            </div>
          </div>
        </div>

        <SheetTabs
          v-model="activeTab"
          :style="tabsStyle"
          class="@5xl:col-span-6 @5xl:col-start-7 @5xl:row-start-2 @5xl:min-h-0"
        >
          <template #inventory>
            <SheetInventory />
          </template>

          <template #spells>
            <SheetSpells />
          </template>

          <template #features>
            <SheetFeatures />
          </template>

          <template #effects>
            <SheetEffects />
          </template>

          <template #personality>
            <SheetPersonality />
          </template>

          <template #notes>
            <SheetNotes />
          </template>
        </SheetTabs>
      </div>

      <SheetCombatModal
        v-if="combatSection"
        v-model:open="isCombatOpen"
        :section="combatSection"
      />

      <SheetHealthModal v-model:open="isHealthOpen" />

      <SheetResourcesModal v-model:open="isResourcesOpen" />

      <SheetLevelUpModal />
    </template>
  </div>
</template>
