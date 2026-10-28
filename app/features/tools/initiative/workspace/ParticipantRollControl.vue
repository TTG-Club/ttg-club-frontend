<script setup lang="ts">
  import type { TrackerParticipant } from '../model';

  import {
    INITIATIVE_ICON,
    INITIATIVE_LIMIT,
    INITIATIVE_TEXT,
    isParticipantRolled,
    pickPairRoll,
  } from '../model';

  /**
   * Инициатива участника: итог, а по клику — бросок, бросок с преимуществом
   * или помехой и своё значение к20.
   */
  const { participant, isDisabled = false } = defineProps<{
    participant: TrackerParticipant;
    isDisabled?: boolean;
  }>();

  const emit = defineEmits<{
    'roll': [];
    'set-roll': [value: number];
  }>();

  const isOpen = ref(false);

  const manualRoll = ref<number>();

  const total = computed(() => participant.initiativeTotal ?? '—');

  const rollLabel = computed(() =>
    isParticipantRolled(participant)
      ? INITIATIVE_TEXT.reroll
      : INITIATIVE_TEXT.roll,
  );

  // Поле своего значения начинается с текущего броска
  watch(isOpen, (open) => {
    if (open) {
      manualRoll.value = participant.initiativeRoll ?? undefined;
    }
  });

  /** Случайная к20 на клиенте: для преимущества и помехи нужны две. */
  function rollDie(): number {
    return (
      Math.floor(Math.random() * INITIATIVE_LIMIT.rollMax)
      + INITIATIVE_LIMIT.rollMin
    );
  }

  function roll(): void {
    isOpen.value = false;
    emit('roll');
  }

  /**
   * Бросает две к20 и отправляет больший или меньший результат.
   * @param isAdvantage - преимущество, иначе помеха
   */
  function rollPair(isAdvantage: boolean): void {
    isOpen.value = false;
    emit('set-roll', pickPairRoll(rollDie(), rollDie(), isAdvantage));
  }

  function rollAdvantage(): void {
    rollPair(true);
  }

  function rollDisadvantage(): void {
    rollPair(false);
  }

  function applyManual(): void {
    isOpen.value = false;

    if (
      manualRoll.value === undefined
      || manualRoll.value === participant.initiativeRoll
    ) {
      return;
    }

    emit('set-roll', manualRoll.value);
  }
</script>

<template>
  <UPopover v-model:open="isOpen">
    <UButton
      :label="String(total)"
      :disabled="isDisabled"
      :aria-label="INITIATIVE_TEXT.initiative"
      color="neutral"
      variant="subtle"
      class="min-w-12 justify-center text-lg font-semibold"
    />

    <template #content>
      <div class="flex w-64 flex-col gap-2 p-3">
        <UButton
          :label="rollLabel"
          :icon="INITIATIVE_ICON.roll"
          block
          @click.left.exact.prevent="roll"
        />

        <div class="flex flex-col gap-2">
          <UButton
            :label="INITIATIVE_TEXT.advantage"
            :icon="INITIATIVE_ICON.advantage"
            color="neutral"
            variant="subtle"
            size="sm"
            block
            @click.left.exact.prevent="rollAdvantage"
          />

          <UButton
            :label="INITIATIVE_TEXT.disadvantage"
            :icon="INITIATIVE_ICON.disadvantage"
            color="neutral"
            variant="subtle"
            size="sm"
            block
            @click.left.exact.prevent="rollDisadvantage"
          />
        </div>

        <form
          class="flex items-end gap-2"
          @submit.prevent="applyManual"
        >
          <UFormField
            :label="INITIATIVE_TEXT.manualRoll"
            class="flex-auto"
          >
            <UInputNumber
              v-model="manualRoll"
              :min="INITIATIVE_LIMIT.rollMin"
              :max="INITIATIVE_LIMIT.rollMax"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            :label="INITIATIVE_TEXT.apply"
            color="neutral"
            variant="subtle"
          />
        </form>
      </div>
    </template>
  </UPopover>
</template>
