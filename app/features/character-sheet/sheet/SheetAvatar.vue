<script setup lang="ts">
  import { useCharacterSheet, useSheetAvatar } from '../composables';
  import { SheetAvatarCropModal, SheetConfirmModal } from '../dialogs';
  import {
    SHEET_AVATAR_ACCEPT,
    SHEET_AVATAR_ICON,
    SHEET_AVATAR_TEXT,
    SHEET_AVATAR_TYPES,
    SHEET_BODY_LABELS,
  } from '../model';

  /**
   * Портрет персонажа в шапке листа. Файл выбирается кнопкой или
   * перетаскиванием, затем открывается выбор квадратной области. Действия
   * видны при наведении, на сенсорных экранах — по нажатию на портрет.
   */
  const { name, isLocked, ensureEditable } = useCharacterSheet();

  const { avatarUrl, isBusy, replaceAvatar, clearAvatar } = useSheetAvatar();

  const overlay = useOverlay();

  /** Открыто подтверждение удаления портрета. */
  const isRemoveOpen = ref(false);

  /** Адрес есть, но файл не открылся (пропал из хранилища). */
  const isImageBroken = ref(false);

  /** Действия вызваны нажатием по портрету (сенсорный экран). */
  const areActionsRevealed = ref(false);

  watch(avatarUrl, () => {
    isImageBroken.value = false;
    areActionsRevealed.value = false;
  });

  const hasImage = computed(
    () => Boolean(avatarUrl.value) && !isImageBroken.value,
  );

  const imageSource = computed(() => avatarUrl.value ?? undefined);

  const canEdit = computed(() => !isLocked.value);

  /**
   * Выбор области и загрузка. Окно создаётся на каждый файл и снимается
   * после закрытия, поэтому следующий выбор открывает новую картинку.
   * @param file - выбранный файл
   */
  async function cropAndUpload(file: File): Promise<void> {
    const cropModal = overlay.create(SheetAvatarCropModal, {
      destroyOnClose: true,
      props: { file },
    });

    const cropped = await cropModal.open();

    if (cropped) {
      await replaceAvatar(cropped);
    }
  }

  /**
   * Выбранный или перетащенный файл. Право на правку проверяется до окна:
   * выбирать область на запертом листе бессмысленно.
   * @param files - выбор из диалога или перетаскивания
   */
  function handleFiles(files: Array<File> | FileList | null): void {
    const file = files ? Array.from(files)[0] : undefined;

    if (!file || !ensureEditable()) {
      return;
    }

    void cropAndUpload(file);
  }

  const { open: openFileDialog, onChange } = useFileDialog({
    accept: SHEET_AVATAR_ACCEPT,
    multiple: false,
    reset: true,
  });

  onChange(handleFiles);

  function pickFile(): void {
    areActionsRevealed.value = false;
    openFileDialog();
  }

  /** Удаление с подтверждением: файл стирается из хранилища насовсем. */
  function removeAvatar(): void {
    areActionsRevealed.value = false;

    isRemoveOpen.value = true;
  }

  function revealActions(): void {
    areActionsRevealed.value = true;
  }

  const dropZoneRef = useTemplateRef<HTMLElement>('dropZoneRef');

  // Нажатие мимо портрета прячет действия
  onClickOutside(dropZoneRef, () => {
    areActionsRevealed.value = false;
  });

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    dataTypes: [...SHEET_AVATAR_TYPES],
    multiple: false,
    onDrop: handleFiles,
  });

  // Подсветка рамки — только когда файл действительно примут
  const borderClass = computed(() =>
    isOverDropZone.value && canEdit.value
      ? 'border-primary'
      : 'border-primary/60',
  );

  const OVERLAY_CLASS =
    'absolute inset-0 flex items-center justify-center gap-1 bg-elevated/85 transition-opacity';

  const HOVER_REVEAL_CLASS =
    'opacity-0 group-hover:opacity-100 focus-within:opacity-100 focus-visible:opacity-100';

  const actionsRevealClass = computed(() =>
    areActionsRevealed.value ? 'opacity-100' : HOVER_REVEAL_CLASS,
  );
</script>

<template>
  <div
    ref="dropZoneRef"
    class="group relative size-24 overflow-hidden rounded-full border-2 bg-elevated"
    :class="borderClass"
    :aria-label="SHEET_BODY_LABELS.avatar"
  >
    <img
      v-if="hasImage"
      :src="imageSource"
      :alt="name"
      class="size-full object-cover"
      @error="isImageBroken = true"
    />

    <div
      v-else
      class="grid size-full place-items-center"
    >
      <UIcon
        :name="SHEET_AVATAR_ICON.empty"
        class="size-10 text-muted"
      />
    </div>

    <div
      v-if="isBusy"
      class="absolute inset-0 grid place-items-center bg-elevated/85"
    >
      <UIcon
        :name="SHEET_AVATAR_ICON.loading"
        class="size-7 animate-spin text-muted"
      />
    </div>

    <template v-else-if="canEdit">
      <UTooltip
        v-if="!hasImage"
        :text="SHEET_AVATAR_TEXT.add"
      >
        <button
          type="button"
          class="cursor-pointer"
          :class="[OVERLAY_CLASS, HOVER_REVEAL_CLASS]"
          :aria-label="SHEET_AVATAR_TEXT.addAria"
          @click.left.exact.prevent="pickFile"
        >
          <UIcon
            :name="SHEET_AVATAR_ICON.add"
            class="size-8 text-highlighted"
          />
        </button>
      </UTooltip>

      <div
        v-else
        :class="[OVERLAY_CLASS, actionsRevealClass]"
      >
        <UTooltip :text="SHEET_AVATAR_TEXT.replace">
          <UButton
            :icon="SHEET_AVATAR_ICON.replace"
            color="neutral"
            variant="soft"
            size="sm"
            square
            class="rounded-full"
            :aria-label="SHEET_AVATAR_TEXT.replace"
            @click.left.exact.prevent="pickFile"
          />
        </UTooltip>

        <UTooltip :text="SHEET_AVATAR_TEXT.remove">
          <UButton
            :icon="SHEET_AVATAR_ICON.remove"
            color="error"
            variant="soft"
            size="sm"
            square
            class="rounded-full"
            :aria-label="SHEET_AVATAR_TEXT.remove"
            @click.left.exact.prevent="removeAvatar"
          />
        </UTooltip>
      </div>

      <button
        v-if="hasImage && !areActionsRevealed"
        type="button"
        class="absolute inset-0 cursor-pointer pointer-fine:hidden"
        :aria-label="SHEET_AVATAR_TEXT.reveal"
        @click.left.exact.prevent="revealActions"
      />
    </template>

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="SHEET_AVATAR_TEXT.removeTitle"
      :description="SHEET_AVATAR_TEXT.removeDescription"
      @confirm="clearAvatar"
    />
  </div>
</template>
