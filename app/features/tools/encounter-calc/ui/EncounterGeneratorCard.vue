<script setup lang="ts">
  import type {
    EncounterSelectItem,
    EncounterTableRoll,
    GenerationDifficulty,
  } from '../model';

  import { ContentRender } from '~content/render';

  import {
    DEFAULT_GENERATION_DIFFICULTY,
    GENERATION_DIFFICULTY_OPTIONS,
    GENERATION_TEXT,
    TABLE_ROLL_TEXT,
  } from '../model';

  /**
   * Генерация столкновения: общая среда обитания и два способа — добрать
   * существ из бестиария до сложности или бросить по таблицам случайных
   * столкновений (диапазон таблиц — по среднему уровню группы). Под
   * формой — выпавшая строка таблицы.
   */
  const {
    environments,
    tableEnvironments,
    tierLabel = undefined,
    lastRoll = undefined,
    generating = false,
    rolling = false,
    canGenerate = true,
    canRoll = true,
  } = defineProps<{
    environments: Array<EncounterSelectItem>;
    tableEnvironments: Array<EncounterSelectItem>;
    tierLabel?: string;
    lastRoll?: EncounterTableRoll;
    generating?: boolean;
    rolling?: boolean;
    canGenerate?: boolean;
    canRoll?: boolean;
  }>();

  const emit = defineEmits<{
    generate: [
      difficulty: GenerationDifficulty,
      environment: string | undefined,
    ];
    roll: [environment: string | undefined];
  }>();

  const difficulty = ref<GenerationDifficulty>(DEFAULT_GENERATION_DIFFICULTY);
  const environment = ref<string>();

  /** Выбранная среда, если для неё есть таблицы; иначе — случайная. */
  const tableEnvironment = computed(() =>
    tableEnvironments.some(({ value }) => value === environment.value)
      ? environment.value
      : undefined,
  );

  const hasNoTableEnvironment = computed(
    () =>
      !!environment.value
      && !!tableEnvironments.length
      && !tableEnvironment.value,
  );

  /** Добирает существ из бестиария до выбранной сложности. */
  function generate(): void {
    if (generating || !canGenerate) {
      return;
    }

    emit('generate', difficulty.value, environment.value);
  }

  /** Бросает по таблице случайных столкновений. */
  function roll(): void {
    if (rolling || !canRoll) {
      return;
    }

    emit('roll', tableEnvironment.value);
  }
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
    @submit.prevent="generate"
  >
    <div
      class="flex flex-wrap items-center gap-2 text-sm font-semibold text-highlighted"
    >
      <UIcon
        name="tabler:dice-5"
        class="size-5 text-primary"
      />

      {{ GENERATION_TEXT.title }}
    </div>

    <UFormField :label="GENERATION_TEXT.environment">
      <USelectMenu
        v-model="environment"
        :items="environments"
        :placeholder="GENERATION_TEXT.environmentPlaceholder"
        :search-input="false"
        value-key="value"
        clear
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="GENERATION_TEXT.difficulty"
      :description="GENERATION_TEXT.hint"
    >
      <USelect
        v-model="difficulty"
        :items="GENERATION_DIFFICULTY_OPTIONS"
        class="w-full"
      />
    </UFormField>

    <UButton
      type="submit"
      icon="tabler:wand"
      class="justify-center"
      :label="GENERATION_TEXT.submit"
      :loading="generating"
      :disabled="!canGenerate"
    />

    <USeparator :label="TABLE_ROLL_TEXT.separator" />

    <p
      v-if="tierLabel"
      class="text-xs text-muted"
    >
      {{ TABLE_ROLL_TEXT.tier }}
      <b class="text-highlighted">{{ tierLabel }}</b>
    </p>

    <p
      v-if="hasNoTableEnvironment"
      class="text-xs text-warning"
    >
      {{ TABLE_ROLL_TEXT.environmentMissing }}
    </p>

    <UButton
      icon="tabler:table"
      class="justify-center"
      variant="soft"
      :label="TABLE_ROLL_TEXT.submit"
      :loading="rolling"
      :disabled="!canRoll"
      @click.left.exact.prevent="roll"
    />

    <article
      v-if="lastRoll"
      :key="lastRoll.id"
      class="flex flex-col gap-2 rounded-lg border border-default bg-elevated/50 p-3 text-sm"
    >
      <p v-if="lastRoll.sourceName">
        <b class="text-highlighted">{{ TABLE_ROLL_TEXT.source }}</b>
        {{ lastRoll.sourceName }}
      </p>

      <p v-if="lastRoll.tableName">
        <b class="text-highlighted">{{ TABLE_ROLL_TEXT.table }}</b>
        {{ lastRoll.tableName }}
      </p>

      <ContentRender :html="lastRoll.description" />

      <p
        v-if="lastRoll.addedCount"
        class="text-xs text-muted"
      >
        {{ TABLE_ROLL_TEXT.added }} {{ lastRoll.addedCount }}
      </p>
    </article>
  </form>
</template>
