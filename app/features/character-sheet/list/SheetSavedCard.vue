<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { SavedSheet, SheetDocument } from '../model';
  import type { SheetPdfVariant } from '../model/pdf';

  import { useSheetPdf } from '../composables';
  import {
    downloadSheetJson,
    getSharedSheetRoute,
    SAVED_SHEETS_TEXT,
    SHEET_ICON,
    SHEET_LIST_ICON,
    SHEET_LIST_TEXT,
    SHEET_SHARE_ICON,
  } from '../model';
  import SheetCardShell from './SheetCardShell.vue';

  /**
   * Карточка чужого листа, сохранённого по ссылке. Недоступный лист (ссылку
   * отозвали или лист удалили) не открывается — его можно только убрать.
   */
  const {
    saved,
    isDisabled = false,
    canCopy = true,
  } = defineProps<{
    saved: SavedSheet;
    isDisabled?: boolean;
    /** В лимите своих листов есть место — копия разрешена. */
    canCopy?: boolean;
  }>();

  const emit = defineEmits<{
    copy: [saved: SavedSheet];
    remove: [saved: SavedSheet];
  }>();

  const route = computed(() =>
    saved.available ? getSharedSheetRoute(saved.shareToken) : undefined,
  );

  const { exportToPdf, getPdfMenuItems } = useSheetPdf();

  /**
   * Скачивает чужой лист в PDF: QR-код ведёт по сохранённой ссылке, доступ
   * не меняется — это право владельца.
   * @param document - документ листа
   * @param variant - вид листа
   */
  async function downloadPdf(
    document: SheetDocument,
    variant: SheetPdfVariant,
  ): Promise<void> {
    await exportToPdf(saved.name, document, {
      variant,
      shareToken: saved.shareToken,
      ownSheetId: null,
    });
  }

  const menuItems = computed<Array<Array<DropdownMenuItem>>>(() => {
    const document = saved.data;

    const actions: Array<DropdownMenuItem> = document
      ? [
          {
            label: SAVED_SHEETS_TEXT.copy,
            icon: SHEET_ICON.copy,
            disabled: !canCopy,
            onSelect: () => emit('copy', saved),
          },
          ...getPdfMenuItems((variant) => downloadPdf(document, variant)),
          {
            label: SHEET_LIST_TEXT.download,
            icon: SHEET_LIST_ICON.download,
            onSelect: () =>
              downloadSheetJson({ name: saved.name, data: document }),
          },
        ]
      : [];

    return [
      ...(actions.length ? [actions] : []),
      [
        {
          label: SAVED_SHEETS_TEXT.remove,
          icon: SHEET_SHARE_ICON.remove,
          color: 'error',
          onSelect: () => emit('remove', saved),
        },
      ],
    ];
  });
</script>

<template>
  <SheetCardShell
    :name="saved.name"
    :document="saved.data"
    :to="route"
    :menu-items="menuItems"
    :menu-aria="SAVED_SHEETS_TEXT.menuAria"
    :badge="saved.available ? undefined : SAVED_SHEETS_TEXT.unavailableTitle"
    :description="SAVED_SHEETS_TEXT.unavailableDescription"
    :is-disabled="isDisabled"
  />
</template>
