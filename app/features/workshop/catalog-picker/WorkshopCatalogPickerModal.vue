<script setup lang="ts">
  import type { DetailType } from '~content/model';
  import type { SectionConfig } from '~section/model';

  import type { CatalogPickerEntry } from '../model';

  import { CATALOG_PICKER_ICON, CATALOG_PICKER_TEXT } from '../model';
  import WorkshopCatalogPickerList from './WorkshopCatalogPickerList.vue';

  /**
   * Окно выбора записей раздела: слева фильтры раздела, справа поиск и
   * список с вкладкой отмеченного. Открывается через `useOverlay`: «Готово»
   * отдаёт выбранное, закрытие иначе — ничего.
   */
  const { section, title, previewType, selected } = defineProps<{
    section: SectionConfig;
    /** Заголовок окна: «Оружие», «Доспехи». */
    title: string;
    previewType: DetailType;
    /** Выбранное в поле при открытии. */
    selected: ReadonlyArray<CatalogPickerEntry>;
  }>();

  const emit = defineEmits<{
    close: [entries?: Array<CatalogPickerEntry>];
  }>();

  /**
   * Черновик выбора: правится в окне, а в поле уходит только по «Готово».
   * Снимок делается один раз, при открытии: дальше окно живёт своим
   * состоянием.
   */
  const draft = ref<Array<CatalogPickerEntry>>(
    selected.map((entry) => ({ ...entry })),
  );

  const isClearShown = computed(() => draft.value.length > 0);

  function clear(): void {
    draft.value = [];
  }

  function save(): void {
    emit('close', draft.value);
  }

  function cancel(): void {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="title"
    :ui="{ content: 'max-w-4xl' }"
  >
    <template #body>
      <!-- Список грузит фильтр и записи раздела в setup: пока они в пути,
        окно показывает загрузку, а не пустое место -->
      <Suspense>
        <WorkshopCatalogPickerList
          v-model="draft"
          :section="section"
          :preview-type="previewType"
        />

        <template #fallback>
          <div class="grid h-[65dvh] min-h-96 place-items-center">
            <UIcon
              :name="CATALOG_PICKER_ICON.loading"
              class="size-6 animate-spin text-dimmed"
            />
          </div>
        </template>
      </Suspense>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          v-if="isClearShown"
          :icon="CATALOG_PICKER_ICON.remove"
          :label="CATALOG_PICKER_TEXT.clear"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="clear"
        />

        <span v-else />

        <div class="flex gap-2">
          <UButton
            :label="CATALOG_PICKER_TEXT.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="cancel"
          />

          <UButton
            :label="CATALOG_PICKER_TEXT.save"
            @click.left.exact.prevent="save"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
