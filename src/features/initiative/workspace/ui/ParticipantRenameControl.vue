<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import type { TrackerParticipant } from '@/features/initiative/model';
  import { MAX_PARTICIPANT_NAME_LENGTH } from '@/features/initiative/model';

  const { participant, disabled = false } = defineProps<{
    participant: TrackerParticipant;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    rename: [id: string, name: string];
  }>();

  const isOpen = ref(false);
  const nameDraft = ref(participant.name);

  // При открытии синхронизируем черновик с актуальным именем. Закрытый поповер
  // draft не показывает, поэтому этого достаточно и для ресинка после ответа
  // сервера, и для отката после неуспешной мутации.
  watch(isOpen, (open) => {
    if (open) {
      nameDraft.value = participant.name;
    }
  });

  function applyRename(): void {
    isOpen.value = false;

    const trimmed = nameDraft.value.trim();

    // Пустое или неизменённое имя — не мутация, просто закрываем поповер.
    if (!trimmed || trimmed === participant.name) {
      return;
    }

    emit('rename', participant.id, trimmed);
  }
</script>

<template>
  <n-popover
    v-model:show="isOpen"
    trigger="click"
    placement="bottom"
    :show-arrow="false"
    raw
    class="rename-control__popover"
  >
    <template #trigger>
      <n-button
        quaternary
        circle
        size="small"
        :disabled="disabled"
        aria-label="Переименовать участника"
      >
        <template #icon>
          <icon icon="tabler:pencil" />
        </template>
      </n-button>
    </template>

    <form
      class="rename-control__form"
      @submit.prevent="applyRename"
    >
      <n-input
        v-model:value="nameDraft"
        :maxlength="MAX_PARTICIPANT_NAME_LENGTH"
        class="rename-control__input"
        autofocus
        placeholder="Имя участника"
        aria-label="Имя участника"
      />

      <n-button
        attr-type="submit"
        secondary
      >
        ОК
      </n-button>
    </form>
  </n-popover>
</template>

<style scoped lang="scss">
  .rename-control {
    &__form {
      display: flex;
      gap: 8px;
      align-items: center;

      width: 288px;
      padding: 12px;

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__input {
      flex: 1 1 auto;
      min-width: 0;
    }
  }
</style>
