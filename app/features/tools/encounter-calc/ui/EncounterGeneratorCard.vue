<script setup lang="ts">
  import type { EncounterSelectItem, GenerationDifficulty } from '../model';

  import {
    DEFAULT_GENERATION_DIFFICULTY,
    GENERATION_DIFFICULTY_OPTIONS,
    GENERATION_TEXT,
  } from '../model';

  const {
    environments,
    loading = false,
    disabled = false,
  } = defineProps<{
    environments: Array<EncounterSelectItem>;
    loading?: boolean;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    generate: [
      difficulty: GenerationDifficulty,
      environment: string | undefined,
    ];
  }>();

  const difficulty = ref<GenerationDifficulty>(DEFAULT_GENERATION_DIFFICULTY);
  const environment = ref<string>();

  /** Запускает генерацию с выбранными сложностью и средой обитания. */
  function submit(): void {
    if (loading || disabled) {
      return;
    }

    emit('generate', difficulty.value, environment.value);
  }
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
    @submit.prevent="submit"
  >
    <div
      class="flex flex-wrap items-center gap-2 text-sm font-semibold text-highlighted"
    >
      <UIcon
        name="tabler:dice-5"
        class="size-5 text-primary"
      />

      {{ GENERATION_TEXT.title }}

      <span class="ml-auto text-xs font-normal text-muted">
        {{ GENERATION_TEXT.hint }}
      </span>
    </div>

    <UFormField :label="GENERATION_TEXT.difficulty">
      <USelect
        v-model="difficulty"
        :items="GENERATION_DIFFICULTY_OPTIONS"
        class="w-full"
      />
    </UFormField>

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

    <UButton
      type="submit"
      icon="tabler:wand"
      class="justify-center"
      :label="GENERATION_TEXT.submit"
      :loading
      :disabled
    />
  </form>
</template>
