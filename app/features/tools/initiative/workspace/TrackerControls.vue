<script setup lang="ts">
  import { TrackerConfirmModal } from '../dialogs';
  import { INITIATIVE_ICON, INITIATIVE_TEXT } from '../model';

  /**
   * Управление боем: в подготовке — броски и старт, в бою — ходы и
   * завершение.
   */
  const {
    isCombat = false,
    isMutating = false,
    hasParticipants = false,
    hasCreatures = false,
  } = defineProps<{
    isCombat?: boolean;
    isMutating?: boolean;
    hasParticipants?: boolean;
    hasCreatures?: boolean;
  }>();

  const emit = defineEmits<{
    'roll-all': [];
    'roll-creatures': [];
    'start': [];
    'previous': [];
    'next': [];
    'reset': [];
  }>();

  const isResetOpen = ref(false);

  const isStartDisabled = computed(() => isMutating || !hasParticipants);

  const isCreaturesDisabled = computed(() => isMutating || !hasCreatures);

  function rollAll(): void {
    emit('roll-all');
  }

  function rollCreatures(): void {
    emit('roll-creatures');
  }

  function start(): void {
    emit('start');
  }

  function previous(): void {
    emit('previous');
  }

  function next(): void {
    emit('next');
  }

  function openReset(): void {
    isResetOpen.value = true;
  }

  function reset(): void {
    emit('reset');
  }
</script>

<template>
  <div
    v-if="isCombat"
    class="flex gap-2"
  >
    <UTooltip :text="INITIATIVE_TEXT.previous">
      <UButton
        :icon="INITIATIVE_ICON.previous"
        :aria-label="INITIATIVE_TEXT.previous"
        :disabled="isMutating"
        color="neutral"
        variant="subtle"
        @click.left.exact.prevent="previous"
      />
    </UTooltip>

    <UButton
      :label="INITIATIVE_TEXT.next"
      :icon="INITIATIVE_ICON.next"
      :loading="isMutating"
      class="flex-auto justify-center"
      @click.left.exact.prevent="next"
    />

    <UTooltip :text="INITIATIVE_TEXT.reset">
      <UButton
        :icon="INITIATIVE_ICON.reset"
        :aria-label="INITIATIVE_TEXT.reset"
        :disabled="isMutating"
        color="neutral"
        variant="subtle"
        @click.left.exact.prevent="openReset"
      />
    </UTooltip>

    <TrackerConfirmModal
      v-model:open="isResetOpen"
      :title="INITIATIVE_TEXT.resetTitle"
      :description="INITIATIVE_TEXT.resetDescription"
      :confirm-label="INITIATIVE_TEXT.reset"
      :confirm-icon="INITIATIVE_ICON.reset"
      color="warning"
      @confirm="reset"
    />
  </div>

  <div
    v-else
    class="flex flex-col gap-2"
  >
    <div class="flex flex-wrap gap-2">
      <UButton
        :label="INITIATIVE_TEXT.rollAll"
        :icon="INITIATIVE_ICON.rollAll"
        :disabled="isStartDisabled"
        color="neutral"
        variant="subtle"
        class="flex-auto justify-center"
        @click.left.exact.prevent="rollAll"
      />

      <UButton
        :label="INITIATIVE_TEXT.rollCreatures"
        :icon="INITIATIVE_ICON.creature"
        :disabled="isCreaturesDisabled"
        color="neutral"
        variant="subtle"
        class="flex-auto justify-center"
        @click.left.exact.prevent="rollCreatures"
      />
    </div>

    <UButton
      :label="INITIATIVE_TEXT.start"
      :icon="INITIATIVE_ICON.start"
      :loading="isMutating"
      :disabled="isStartDisabled"
      block
      @click.left.exact.prevent="start"
    />
  </div>
</template>
