<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { CharacterSheet } from '../model';
  import type { SheetPdfVariant } from '../model/pdf';

  import { useSheetPdf } from '../composables';
  import {
    downloadSheetJson,
    getSheetRoute,
    SHEET_ICON,
    SHEET_LIST_ICON,
    SHEET_LIST_TEXT,
    SHEET_SHARE_ICON,
    SHEET_SHARE_TEXT,
    SHEET_TEXT,
  } from '../model';
  import SheetCardShell from './SheetCardShell.vue';

  /**
   * Карточка своего листа в списке: сводка, пометка открытой ссылки и меню —
   * поделиться, копия, PDF, JSON, удаление.
   */
  const {
    sheet,
    isDisabled = false,
    canCopy = true,
  } = defineProps<{
    sheet: CharacterSheet;
    isDisabled?: boolean;

    /** В лимите есть место — копия разрешена. */
    canCopy?: boolean;
  }>();

  const emit = defineEmits<{
    'copy': [sheet: CharacterSheet];
    'remove': [sheet: CharacterSheet];
    'share': [sheet: CharacterSheet];

    /** Экспорт PDF включил доступ по ссылке ради QR-кода. */
    'share-enabled': [sheetId: string, shareToken: string];
  }>();

  const route = computed(() => getSheetRoute(sheet.id));

  const { exportToPdf, getPdfMenuItems } = useSheetPdf();

  /**
   * Скачивает лист в PDF; без ссылки экспорт включает доступ по ней.
   * @param variant - вид листа
   */
  async function downloadPdf(variant: SheetPdfVariant): Promise<void> {
    const enabledToken = await exportToPdf(sheet.name, sheet.data, {
      variant,
      shareToken: sheet.shareToken,
      ownSheetId: sheet.id,
    });

    if (enabledToken) {
      emit('share-enabled', sheet.id, enabledToken);
    }
  }

  const menuItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    [
      {
        label: SHEET_SHARE_TEXT.menu,
        icon: SHEET_SHARE_ICON.share,
        onSelect: () => emit('share', sheet),
      },
      {
        label: SHEET_TEXT.copy,
        icon: SHEET_ICON.copy,
        disabled: !canCopy,
        onSelect: () => emit('copy', sheet),
      },
      ...getPdfMenuItems(downloadPdf),
      {
        label: SHEET_LIST_TEXT.download,
        icon: SHEET_LIST_ICON.download,
        onSelect: () => downloadSheetJson(sheet),
      },
    ],
    [
      {
        label: SHEET_TEXT.remove,
        icon: SHEET_ICON.remove,
        color: 'error',
        onSelect: () => emit('remove', sheet),
      },
    ],
  ]);
</script>

<template>
  <SheetCardShell
    :name="sheet.name"
    :document="sheet.data"
    :to="route"
    :menu-items="menuItems"
    :menu-aria="SHEET_LIST_TEXT.menuAria"
    :badge="sheet.shareToken ? SHEET_SHARE_TEXT.active : undefined"
    :is-disabled="isDisabled"
  />
</template>
