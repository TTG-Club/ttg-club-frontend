<script setup lang="ts">
  import { ContentRender } from '~content/render';

  import { useCharacterSheet, useSheetPickers } from '../composables';
  import { SheetMarkupTextModal, SheetPersonalityModal } from '../dialogs';
  import {
    PERSONALITY_TEXT,
    PERSONALITY_TEXT_FIELDS,
    PERSONALITY_TILE_CLASS,
    PERSONALITY_TRAIT_FIELDS,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /** Ключ текста личности в разметке. */
  type TextKey = (typeof PERSONALITY_TEXT_FIELDS)[number]['key'];

  /**
   * Личность, как на new.ttg.club: плитки примет и мировоззрения (клик
   * открывает окно с фокусом на поле), предыстория со ссылкой на справочник
   * или выбором, а тексты 2014 — черты характера, идеалы, привязанности,
   * слабости, описание и история — панелями в разметке со своим окном.
   */
  const { document, update, ensureEditable, editControlClass } =
    useCharacterSheet();

  const { isBackgroundPickerOpen } = useSheetPickers();

  const isTraitsOpen = ref(false);
  const focusField = ref<string | null>(null);
  const editedText = ref<TextKey | null>(null);
  const isTextOpen = ref(false);

  const traitTiles = computed(() =>
    [
      {
        key: 'alignment',
        label: SHEET_LABELS.alignment,
        value: document.value.alignment,
        isWide: true,
      },
      ...PERSONALITY_TRAIT_FIELDS.map((field) => ({
        key: field.key,
        label: field.label,
        value: document.value.personality[field.key],
        isWide: false,
      })),
    ].map((tile) => ({
      ...tile,
      display: tile.value.trim() || '—',
      valueClass: tile.value.trim() ? 'text-highlighted' : 'text-dimmed',
      tileClass: tile.isWide ? 'col-span-2' : '',
    })),
  );

  const textPanels = computed(() =>
    PERSONALITY_TEXT_FIELDS.map((field) => ({
      ...field,
      blocks: document.value.personality[field.key],
      panelClass: field.isWide ? '@lg:col-span-2' : '',
    })),
  );

  const editedTitle = computed(
    () =>
      PERSONALITY_TEXT_FIELDS.find((field) => field.key === editedText.value)
        ?.label ?? '',
  );

  const editedValue = computed(() =>
    editedText.value ? document.value.personality[editedText.value] : [],
  );

  /**
   * Окно примет с фокусом на поле.
   * @param field - поле плитки; null — без фокуса
   */
  function openTraits(field: string | null): void {
    if (!ensureEditable()) {
      return;
    }

    focusField.value = field;
    isTraitsOpen.value = true;
  }

  /**
   * Окно текста личности.
   * @param key - текст
   */
  function openText(key: TextKey): void {
    if (!ensureEditable()) {
      return;
    }

    editedText.value = key;
    isTextOpen.value = true;
  }

  /**
   * Сохраняет текст личности.
   * @param blocks - блоки разметки
   */
  function saveText(blocks: Array<string>): void {
    const key = editedText.value;

    if (!key) {
      return;
    }

    update((current) => ({
      ...current,
      personality: { ...current.personality, [key]: blocks },
    }));
  }

  function chooseBackground(): void {
    if (ensureEditable()) {
      isBackgroundPickerOpen.value = true;
    }
  }
</script>

<template>
  <div class="@container flex flex-col gap-4 pt-2">
    <SheetPanel :title="PERSONALITY_TEXT.traitsTitle">
      <template #title-actions>
        <UButton
          :icon="SHEET_ICON.edit"
          :aria-label="PERSONALITY_TEXT.editTraits"
          color="neutral"
          variant="ghost"
          size="xs"
          :class="editControlClass"
          @click.left.exact.prevent="openTraits(null)"
        />
      </template>

      <div class="grid grid-cols-2 gap-2 @md:grid-cols-4">
        <button
          v-for="tile in traitTiles"
          :key="tile.key"
          type="button"
          :class="[PERSONALITY_TILE_CLASS, tile.tileClass]"
          :aria-label="`${PERSONALITY_TEXT.edit}: ${tile.label}`"
          @click.left.exact.prevent="openTraits(tile.key)"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ tile.label }}
          </span>

          <span
            class="truncate text-sm font-medium"
            :class="tile.valueClass"
          >
            {{ tile.display }}
          </span>
        </button>
      </div>
    </SheetPanel>

    <SheetPanel :title="PERSONALITY_TEXT.backgroundTitle">
      <div
        v-if="document.background"
        class="flex items-center gap-2"
      >
        <span class="text-sm font-medium text-highlighted">
          {{ document.background.name }}
        </span>

        <UButton
          v-if="document.background.url"
          :to="document.background.url"
          target="_blank"
          :icon="SHEET_ICON.link"
          :aria-label="PERSONALITY_TEXT.openBackground"
          color="neutral"
          variant="ghost"
          size="xs"
        />
      </div>

      <div
        v-else
        class="flex items-center justify-between gap-2"
      >
        <span class="text-sm text-dimmed">
          {{ PERSONALITY_TEXT.noBackground }}
        </span>

        <UButton
          :label="PERSONALITY_TEXT.chooseBackground"
          :icon="SHEET_ICON.catalog"
          color="neutral"
          variant="subtle"
          size="xs"
          :class="editControlClass"
          @click.left.exact.prevent="chooseBackground"
        />
      </div>
    </SheetPanel>

    <div class="grid gap-4 @lg:grid-cols-2">
      <SheetPanel
        v-for="panel in textPanels"
        :key="panel.key"
        :title="panel.label"
        :class="panel.panelClass"
      >
        <template #title-actions>
          <UButton
            :icon="SHEET_ICON.edit"
            :aria-label="`${PERSONALITY_TEXT.edit}: ${panel.label}`"
            color="neutral"
            variant="ghost"
            size="xs"
            :class="editControlClass"
            @click.left.exact.prevent="openText(panel.key)"
          />
        </template>

        <ContentRender
          v-if="panel.blocks.length"
          :content="panel.blocks"
          class="text-sm"
        />

        <div
          v-else
          class="flex items-center justify-between gap-2"
        >
          <span class="text-sm text-dimmed">{{ PERSONALITY_TEXT.empty }}</span>

          <UButton
            :label="PERSONALITY_TEXT.add"
            :icon="SHEET_ICON.add"
            color="neutral"
            variant="ghost"
            size="xs"
            :class="editControlClass"
            @click.left.exact.prevent="openText(panel.key)"
          />
        </div>
      </SheetPanel>
    </div>

    <SheetPersonalityModal
      v-model:open="isTraitsOpen"
      :focus-field="focusField"
    />

    <SheetMarkupTextModal
      v-model:open="isTextOpen"
      :title="editedTitle"
      :value="editedValue"
      @save="saveText"
    />
  </div>
</template>
