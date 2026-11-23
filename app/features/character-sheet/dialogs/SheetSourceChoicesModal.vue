<script setup lang="ts">
  import type { SheetDocument } from '../model';

  import { useCharacterSheet } from '../composables';
  import { CHOICE_TEXT, findSource, SOURCE_KIND_LABELS } from '../model';
  import SheetSourceChoices from './SheetSourceChoices.vue';

  /**
   * Окно выборов источника на листе: раса, предыстория, черта, умение.
   * Ответы применяются к листу сразу.
   */
  const { sourceIds } = defineProps<{
    /** Источники, чьи выборы показать (раса и её особенности). */
    sourceIds: ReadonlyArray<string>;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();

  const title = computed(() => {
    const first = sourceIds[0]
      ? findSource(document.value, sourceIds[0])
      : undefined;

    return first
      ? `${SOURCE_KIND_LABELS[first.kind]}: ${first.name}`
      : CHOICE_TEXT.title;
  });

  /**
   * Подставляет документ с ответом.
   * @param next - новый документ
   */
  function apply(next: SheetDocument): void {
    update(() => next);
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-2xl', body: 'flex flex-col gap-3' }"
  >
    <template #body>
      <SheetSourceChoices
        v-for="id in sourceIds"
        :key="id"
        :document="document"
        :source-id="id"
        @change="apply"
      />
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          :label="CHOICE_TEXT.done"
          @click.left.exact.prevent="isOpen = false"
        />
      </div>
    </template>
  </UModal>
</template>
