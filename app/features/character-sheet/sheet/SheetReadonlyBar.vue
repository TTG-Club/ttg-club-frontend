<script setup lang="ts">
  import { getApiErrorMessage } from '~user/model';

  import { useCharacterSheet, useSheetList } from '../composables';
  import {
    getSheetRoute,
    saveSharedSheet,
    SHEET_READONLY_TEXT,
    SHEET_SHARE_ICON,
  } from '../model';

  /**
   * Полоса листа, открытого по ссылке: пометка «Только просмотр» и действия
   * гостя — копия себе и сохранение в «Других листах». Владельцу — переход
   * к своему листу.
   */
  const toast = useToast();
  const { isLoggedIn } = useUser();

  const { sheetId, name, document, sharedToken, sharedInfo, markShared } =
    useCharacterSheet();

  const { copyDocument, isMutating } = useSheetList();

  const isSaving = ref(false);

  const isOwn = computed(() => sharedInfo.value?.own === true);
  const isSaved = computed(() => Boolean(sharedInfo.value?.savedId));

  const ownRoute = computed(() =>
    sheetId.value ? getSheetRoute(sheetId.value) : undefined,
  );

  /** Копия листа себе; открывается сразу. Лимит объясняет тост. */
  async function copyToOwn(): Promise<void> {
    const created = await copyDocument(name.value, document.value);

    if (created) {
      await navigateTo(getSheetRoute(created.id));
    }
  }

  /** Сохраняет лист в «Других листах». */
  async function saveToOthers(): Promise<void> {
    const token = sharedToken.value;

    if (!token) {
      return;
    }

    isSaving.value = true;

    try {
      const saved = await saveSharedSheet(token);

      markShared(saved.id);

      toast.add({
        title: SHEET_READONLY_TEXT.savedToast,
        description: SHEET_READONLY_TEXT.savedToastDescription(saved.name),
        color: 'success',
      });
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_READONLY_TEXT.saveError),
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }
  }
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-2">
    <UTooltip :text="SHEET_READONLY_TEXT.tooltip">
      <UBadge
        :label="SHEET_READONLY_TEXT.badge"
        :icon="SHEET_SHARE_ICON.readonly"
        color="neutral"
        variant="subtle"
      />
    </UTooltip>

    <UButton
      v-if="isOwn"
      :label="SHEET_READONLY_TEXT.openOwn"
      :to="ownRoute"
      size="sm"
    />

    <template v-else-if="isLoggedIn">
      <UButton
        :label="SHEET_READONLY_TEXT.copy"
        icon="tabler:copy"
        color="neutral"
        variant="subtle"
        size="sm"
        :loading="isMutating"
        @click.left.exact.prevent="copyToOwn"
      />

      <UButton
        :label="isSaved ? SHEET_READONLY_TEXT.saved : SHEET_READONLY_TEXT.save"
        :icon="isSaved ? SHEET_SHARE_ICON.saved : SHEET_SHARE_ICON.save"
        :color="isSaved ? 'neutral' : 'primary'"
        :variant="isSaved ? 'ghost' : 'solid'"
        size="sm"
        :disabled="isSaved"
        :loading="isSaving"
        @click.left.exact.prevent="saveToOthers"
      />
    </template>
  </div>
</template>
