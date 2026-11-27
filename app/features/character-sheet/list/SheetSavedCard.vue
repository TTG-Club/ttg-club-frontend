<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { SavedSheet, SheetCardBadge, SheetDocument } from '../model';
  import type { SheetPdfVariant } from '../model/pdf';

  import { useSheetPdf } from '../composables';
  import {
    downloadSheetJson,
    getSavedSheetEditAction,
    getSharedSheetRoute,
    getSheetRoute,
    SAVED_SHEETS_TEXT,
    SHEET_EDIT_ACCESS_TEXT,
    SHEET_EDIT_ICON,
    SHEET_ICON,
    SHEET_LIST_ICON,
    SHEET_LIST_TEXT,
    SHEET_SHARE_ICON,
  } from '../model';
  import SheetCardShell from './SheetCardShell.vue';

  /**
   * Карточка чужого листа, сохранённого по ссылке. Недоступный лист (ссылку
   * отозвали или лист удалили) не открывается — его можно только убрать.
   * Если владелец разрешил правки, карточка открывает лист на редактирование;
   * иначе правки можно попросить пунктом меню.
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
    'copy': [saved: SavedSheet];
    'remove': [saved: SavedSheet];
    'request-edit': [saved: SavedSheet];
  }>();

  const isEditable = computed(
    () => saved.available && saved.editStatus === 'APPROVED',
  );

  const route = computed(() => {
    if (!saved.available) {
      return undefined;
    }

    return isEditable.value
      ? getSheetRoute(saved.sheetId)
      : getSharedSheetRoute(saved.shareToken);
  });

  const badges = computed(() => {
    const result: Array<SheetCardBadge> = [];

    if (!saved.available) {
      result.push({
        key: 'unavailable',
        label: SAVED_SHEETS_TEXT.unavailableTitle,
        color: 'primary',
      });
    } else if (isEditable.value) {
      result.push({
        key: 'editable',
        icon: SHEET_EDIT_ICON.editor,
        tooltip: SHEET_EDIT_ACCESS_TEXT.approvedBadge,
        color: 'primary',
      });
    }

    return result;
  });

  /** Пункт запроса правок: доступен, ждёт ответа или не нужен. */
  const editMenuItems = computed<Array<DropdownMenuItem>>(() => {
    const action = saved.available
      ? getSavedSheetEditAction(saved.editStatus)
      : null;

    if (action === 'pending') {
      return [
        {
          label: SHEET_EDIT_ACCESS_TEXT.pending,
          icon: SHEET_EDIT_ICON.pending,
          description: SHEET_EDIT_ACCESS_TEXT.pendingHint,
          disabled: true,
        },
      ];
    }

    return action === 'request'
      ? [
          {
            label: SHEET_EDIT_ACCESS_TEXT.request,
            icon: SHEET_EDIT_ICON.request,
            description: SHEET_EDIT_ACCESS_TEXT.requestHint,
            onSelect: () => emit('request-edit', saved),
          },
        ]
      : [];
  });

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
          ...editMenuItems.value,
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
    :badges
    :description="SAVED_SHEETS_TEXT.unavailableDescription"
    :is-disabled="isDisabled"
  />
</template>
