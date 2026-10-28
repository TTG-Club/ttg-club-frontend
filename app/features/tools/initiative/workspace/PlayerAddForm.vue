<script setup lang="ts">
  import type { AddPlayerRequest } from '../model';

  import { INITIATIVE_ICON, INITIATIVE_LIMIT, INITIATIVE_TEXT } from '../model';

  /** Добавление игрока: имя и бонус инициативы. */
  const { isDisabled = false, isLimited = false } = defineProps<{
    isDisabled?: boolean;
    /** Игроков уже максимум. */
    isLimited?: boolean;
  }>();

  const emit = defineEmits<{
    add: [body: AddPlayerRequest];
  }>();

  const name = ref('');
  const bonus = ref(0);

  const trimmedName = computed(() => name.value.trim());

  const isSubmitDisabled = computed(
    () => isDisabled || isLimited || !trimmedName.value,
  );

  function submit(): void {
    if (isSubmitDisabled.value) {
      return;
    }

    emit('add', {
      type: 'PLAYER',
      name: trimmedName.value,
      initiativeBonus: bonus.value,
    });

    name.value = '';
    bonus.value = 0;
  }
</script>

<template>
  <form
    class="flex flex-col gap-3"
    @submit.prevent="submit"
  >
    <UFormField :label="INITIATIVE_TEXT.playerName">
      <UInput
        v-model="name"
        :maxlength="INITIATIVE_LIMIT.name"
        :disabled="isLimited"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="INITIATIVE_TEXT.bonus">
      <UInputNumber
        v-model="bonus"
        :min="INITIATIVE_LIMIT.bonusMin"
        :max="INITIATIVE_LIMIT.bonusMax"
        :disabled="isLimited"
        class="w-full"
      />
    </UFormField>

    <p
      v-if="isLimited"
      class="text-sm text-warning"
    >
      {{ INITIATIVE_TEXT.playersLimit }}
    </p>

    <UButton
      type="submit"
      :label="INITIATIVE_TEXT.add"
      :icon="INITIATIVE_ICON.add"
      :disabled="isSubmitDisabled"
      color="neutral"
      variant="subtle"
      block
    />
  </form>
</template>
