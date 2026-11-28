<script setup lang="ts">
  import type { CustomCreatureDraft } from '../model';

  import {
    CUSTOM_CREATURE_DEFAULT_CHALLENGE_RATING,
    CUSTOM_CREATURE_DEFAULT_NAME,
    CUSTOM_CREATURE_LABELS,
    getChallengeRatingItems,
    MAX_CUSTOM_CREATURE_NAME_LENGTH,
    MAX_ROW_COUNT,
    MIN_ROW_COUNT,
  } from '../model';
  import EncounterNumberInput from './EncounterNumberInput.vue';

  /**
   * Форма своего монстра мастера: название, уровень опасности и количество.
   * Опыт берётся по уровню опасности.
   */
  const { disabled = false } = defineProps<{
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    add: [draft: CustomCreatureDraft];
  }>();

  const challengeRatingItems = getChallengeRatingItems();

  const name = ref('');
  const challengeRating = ref(CUSTOM_CREATURE_DEFAULT_CHALLENGE_RATING);
  const count = ref(MIN_ROW_COUNT);

  /** Добавляет монстра и сбрасывает название и количество. */
  function submit(): void {
    if (disabled) {
      return;
    }

    emit('add', {
      name: name.value,
      challengeRating: challengeRating.value,
      count: count.value,
    });

    name.value = '';
    count.value = MIN_ROW_COUNT;
  }
</script>

<template>
  <form
    class="flex flex-wrap items-end gap-2"
    @submit.prevent="submit"
  >
    <UFormField
      :label="CUSTOM_CREATURE_LABELS.name"
      class="min-w-40 flex-1"
    >
      <UInput
        v-model="name"
        :placeholder="CUSTOM_CREATURE_DEFAULT_NAME"
        :maxlength="MAX_CUSTOM_CREATURE_NAME_LENGTH"
        :disabled
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CUSTOM_CREATURE_LABELS.challengeRating"
      class="shrink-0"
    >
      <USelect
        v-model="challengeRating"
        :items="challengeRatingItems"
        :disabled
        class="w-44"
      />
    </UFormField>

    <UFormField
      :label="CUSTOM_CREATURE_LABELS.count"
      class="shrink-0"
    >
      <EncounterNumberInput
        v-model="count"
        :min="MIN_ROW_COUNT"
        :max="MAX_ROW_COUNT"
        :disabled
        class="w-24"
      />
    </UFormField>

    <UButton
      type="submit"
      icon="tabler:plus"
      class="shrink-0 max-sm:grow max-sm:justify-center"
      :disabled
      :aria-label="CUSTOM_CREATURE_LABELS.submitAria"
    />
  </form>
</template>
