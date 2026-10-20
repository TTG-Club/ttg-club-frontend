<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import type { TrackerDetailed } from '@/features/initiative/model';
  import {
    INITIATIVE_TOOL_ROUTE,
    MAX_TRACKER_NAME_LENGTH,
    TRACKER_STATUS_BADGE,
  } from '@/features/initiative/model';
  import { ConfirmDialog } from '@/features/initiative/ui-kit';

  const {
    tracker,
    isAnonymous = false,
    isMutating = false,
  } = defineProps<{
    tracker: TrackerDetailed;
    isAnonymous?: boolean;
    isMutating?: boolean;
  }>();

  const emit = defineEmits<{
    'rename': [name: string];
    'remove': [];
    'create-new': [];
    'create-another': [];
  }>();

  const router = useRouter();

  const isRenameOpen = ref(false);
  const isDeleteOpen = ref(false);
  const isReplaceOpen = ref(false);
  const renameValue = ref(tracker.name);

  const badge = computed(() => TRACKER_STATUS_BADGE[tracker.status]);

  const badgeType = computed(() =>
    badge.value.color === 'success' ? 'success' : 'default',
  );

  const deleteDescription = computed(() =>
    isAnonymous
      ? `Трекер «${tracker.name}» будет удалён безвозвратно.`
      : `Трекер «${tracker.name}» переедет в историю.`,
  );

  // Синхронизируем поле переименования, если имя изменилось извне и модалка
  // закрыта (не затираем ввод пользователя).
  watch(
    () => tracker.name,
    (value) => {
      if (!isRenameOpen.value) {
        renameValue.value = value;
      }
    },
  );

  function goToList(): void {
    router.push(INITIATIVE_TOOL_ROUTE);
  }

  function openRename(): void {
    renameValue.value = tracker.name;
    isRenameOpen.value = true;
  }

  function submitRename(): void {
    const name = renameValue.value.trim();

    if (!name) {
      return;
    }

    emit('rename', name);
    isRenameOpen.value = false;
  }

  function confirmDelete(): void {
    isDeleteOpen.value = false;
    emit('remove');
  }

  function confirmReplace(): void {
    isReplaceOpen.value = false;
    emit('create-new');
  }
</script>

<template>
  <div class="tracker-header">
    <n-button
      v-if="!isAnonymous"
      quaternary
      circle
      aria-label="К списку трекеров"
      @click="goToList"
    >
      <template #icon>
        <icon icon="tabler:arrow-left" />
      </template>
    </n-button>

    <!-- Имя боя нужно только авторизованным (у них список трекеров);
         анониму оно ни к чему — показываем только статус и действия. -->
    <div
      v-if="!isAnonymous"
      class="tracker-header__title"
    >
      <h2 class="tracker-header__name">{{ tracker.name }}</h2>

      <n-button
        quaternary
        circle
        size="small"
        :disabled="isMutating"
        aria-label="Переименовать трекер"
        @click="openRename"
      >
        <template #icon>
          <icon icon="tabler:pencil" />
        </template>
      </n-button>
    </div>

    <n-tag
      :type="badgeType"
      :bordered="false"
      round
    >
      {{ tracker.statusName }}

      <template #icon>
        <icon :icon="badge.icon" />
      </template>
    </n-tag>

    <n-tag
      v-if="tracker.status === 'ACTIVE'"
      :bordered="false"
      round
    >
      Раунд {{ tracker.round }}
    </n-tag>

    <div class="tracker-header__actions">
      <n-button
        v-if="!isAnonymous"
        quaternary
        :disabled="isMutating"
        @click="emit('create-another')"
      >
        <template #icon>
          <icon icon="tabler:plus" />
        </template>
        Собрать ещё бой
      </n-button>

      <n-button
        v-if="isAnonymous"
        quaternary
        :disabled="isMutating"
        @click="isReplaceOpen = true"
      >
        <template #icon>
          <icon icon="tabler:plus" />
        </template>
        Новый
      </n-button>

      <n-button
        quaternary
        type="error"
        :disabled="isMutating"
        aria-label="Удалить трекер"
        @click="isDeleteOpen = true"
      >
        <template #icon>
          <icon icon="tabler:trash" />
        </template>
      </n-button>
    </div>

    <n-modal
      v-model:show="isRenameOpen"
      preset="card"
      title="Переименовать трекер"
      size="small"
      :bordered="false"
      class="tracker-header__modal"
    >
      <form
        class="tracker-header__form"
        @submit.prevent="submitRename"
      >
        <n-input
          v-model:value="renameValue"
          :maxlength="MAX_TRACKER_NAME_LENGTH"
          placeholder="Название трекера"
          autofocus
        />

        <div class="tracker-header__form-actions">
          <n-button
            quaternary
            @click="isRenameOpen = false"
          >
            Отмена
          </n-button>

          <n-button
            attr-type="submit"
            type="primary"
            :disabled="!renameValue.trim()"
            @click="submitRename"
          >
            Сохранить
          </n-button>
        </div>
      </form>
    </n-modal>

    <confirm-dialog
      v-model:open="isDeleteOpen"
      title="Удалить трекер?"
      :description="deleteDescription"
      confirm-label="Удалить"
      confirm-color="error"
      confirm-icon="tabler:trash"
      @confirm="confirmDelete"
    />

    <confirm-dialog
      v-model:open="isReplaceOpen"
      title="Создать новый трекер?"
      description="Текущий анонимный трекер будет заменён новым — старый удалится безвозвратно."
      confirm-label="Создать новый"
      confirm-icon="tabler:plus"
      @confirm="confirmReplace"
    />
  </div>
</template>

<style scoped lang="scss">
  .tracker-header {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    &__title {
      display: flex;
      gap: 4px;
      align-items: center;
      min-width: 0;
    }

    &__name {
      overflow: hidden;

      margin: 0;

      font-size: 20px;
      font-weight: 600;
      color: var(--text-color-title);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: flex-end;

      margin-left: auto;
    }

    &__modal {
      max-width: 480px;
    }

    &__form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    &__form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }
</style>
