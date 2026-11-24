<script setup lang="ts">
  import type { SheetDocument } from '../model';

  import {
    findSource,
    getChoiceAnswers,
    getSourceChoices,
    getSourceLevel,
    getWizardGrantRows,
    WIZARD_TEXT,
  } from '../model';
  import SheetSourceChoices from './SheetSourceChoices.vue';

  /**
   * Итог мастера по добавленным источникам: что они дают без выборов и
   * выборы каждого источника. Выборы правят черновик мастера.
   */
  const {
    document,
    sourceIds,
    hint = '',
    withGrants = true,
  } = defineProps<{
    /** Черновик мастера. */
    document: SheetDocument;
    /** Источники, добавленные мастером. */
    sourceIds: ReadonlyArray<string>;
    hint?: string;
    /** Показывать блок «Что даёт». */
    withGrants?: boolean;
  }>();

  const emit = defineEmits<{
    change: [document: SheetDocument];
  }>();

  const grantRows = computed(() => getWizardGrantRows(document, sourceIds));

  /** Источники, у которых есть выборы. */
  const choiceSources = computed(() =>
    sourceIds.flatMap((id) => {
      const source = findSource(document, id);

      if (!source) {
        return [];
      }

      const choices = getSourceChoices(
        source,
        getSourceLevel(document, source),
      );

      if (!choices.length) {
        return [];
      }

      const isPending = choices.some(
        (choice) => getChoiceAnswers(source, choice).length < choice.count,
      );

      return [{ id, name: source.name, isPending }];
    }),
  );

  /**
   * Черновик после ответа на выбор.
   * @param next - новый черновик
   */
  function change(next: SheetDocument): void {
    emit('change', next);
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <p
      v-if="hint"
      class="text-xs text-muted"
    >
      {{ hint }}
    </p>

    <section
      v-if="withGrants"
      class="flex flex-col gap-2 rounded-lg border border-default p-3"
    >
      <h4 class="text-[11px] font-bold tracking-wider text-muted uppercase">
        {{ WIZARD_TEXT.grantsTitle }}
      </h4>

      <dl
        v-if="grantRows.length"
        class="flex flex-col gap-2"
      >
        <div
          v-for="row in grantRows"
          :key="row.key"
          class="flex flex-col gap-1"
        >
          <dt class="text-xs text-muted">{{ row.label }}</dt>

          <dd class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="value in row.values"
              :key="value"
              :label="value"
              color="neutral"
              variant="subtle"
            />
          </dd>
        </div>
      </dl>

      <p
        v-else
        class="text-sm text-dimmed"
      >
        {{ WIZARD_TEXT.noGrants }}
      </p>
    </section>

    <section class="flex flex-col gap-2 rounded-lg border border-default p-3">
      <h4 class="text-[11px] font-bold tracking-wider text-muted uppercase">
        {{ WIZARD_TEXT.choicesTitle }}
      </h4>

      <div
        v-for="entry in choiceSources"
        :key="entry.id"
        class="flex flex-col gap-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold text-highlighted">
            {{ entry.name }}
          </span>

          <UBadge
            v-if="entry.isPending"
            :label="WIZARD_TEXT.pendingBadge"
            color="warning"
            variant="subtle"
            size="sm"
          />
        </div>

        <SheetSourceChoices
          :document="document"
          :source-id="entry.id"
          @change="change"
        />
      </div>

      <p
        v-if="!choiceSources.length"
        class="text-sm text-dimmed"
      >
        {{ WIZARD_TEXT.noChoices }}
      </p>
    </section>
  </div>
</template>
