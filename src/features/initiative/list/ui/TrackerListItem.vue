<script setup lang="ts">
  import { Icon } from '@iconify/vue';
  import { h } from 'vue';

  import { getDateString } from '@/shared/utils/getDateString';

  import type { TrackerListItem } from '@/features/initiative/model';
  import {
    MAX_TRACKER_NAME_LENGTH,
    TRACKER_STATUS_BADGE,
  } from '@/features/initiative/model';
  import { ConfirmDialog } from '@/features/initiative/ui-kit';

  import type { DropdownOption } from 'naive-ui';

  const {
    tracker,
    readonly = false,
    disabled = false,
  } = defineProps<{
    tracker: TrackerListItem;
    readonly?: boolean;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    open: [id: string];
    rename: [id: string, name: string];
    remove: [id: string];
  }>();

  const isRenameOpen = ref(false);
  const isDeleteOpen = ref(false);
  const renameValue = ref(tracker.name);

  const badge = computed(() => TRACKER_STATUS_BADGE[tracker.status]);

  const badgeType = computed(() =>
    badge.value.color === 'success' ? 'success' : 'default',
  );

  const isActive = computed(() => tracker.status === 'ACTIVE');
  // Последняя активность (updatedAt) — полезнее даты создания для «продолжить бой».
  const activityLabel = computed(() => getDateString(tracker.updatedAt, 'LLL'));

  const menuOptions = computed<Array<DropdownOption>>(() => [
    {
      label: 'Переименовать',
      key: 'rename',
      icon: () => h(Icon, { icon: 'tabler:pencil' }),
    },
    {
      label: 'Удалить',
      key: 'remove',
      icon: () => h(Icon, { icon: 'tabler:trash' }),
      props: { style: { color: 'var(--error)' } },
    },
  ]);

  function onMenuSelect(key: string): void {
    if (key === 'rename') {
      openRename();
    } else if (key === 'remove') {
      isDeleteOpen.value = true;
    }
  }

  function open(): void {
    if (readonly || disabled) {
      return;
    }

    emit('open', tracker.id);
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

    emit('rename', tracker.id, name);
    isRenameOpen.value = false;
  }

  function confirmRemove(): void {
    emit('remove', tracker.id);
    isDeleteOpen.value = false;
  }
</script>

<template>
  <div
    class="tracker-item"
    :class="{
      'tracker-item--readonly': readonly,
      'tracker-item--disabled': disabled,
    }"
  >
    <component
      :is="readonly ? 'div' : 'button'"
      type="button"
      class="tracker-item__main"
      @click="open"
    >
      <icon
        :icon="badge.icon"
        class="tracker-item__icon"
        :class="{ 'tracker-item__icon--readonly': readonly }"
      />

      <div class="tracker-item__text">
        <span class="tracker-item__name">{{ tracker.name }}</span>

        <span class="tracker-item__activity">{{ activityLabel }}</span>
      </div>
    </component>

    <div class="tracker-item__aside">
      <n-tag
        v-if="readonly"
        :bordered="false"
        round
      >
        В истории

        <template #icon>
          <icon icon="tabler:trash" />
        </template>
      </n-tag>

      <template v-else>
        <n-tag
          v-if="isActive"
          :bordered="false"
          round
        >
          Раунд {{ tracker.round }}
        </n-tag>

        <n-tag
          :type="badgeType"
          :bordered="false"
          round
        >
          {{ tracker.statusName }}
        </n-tag>

        <n-dropdown
          trigger="click"
          :options="menuOptions"
          @select="onMenuSelect"
        >
          <n-button
            quaternary
            circle
            size="small"
            :disabled="disabled"
            aria-label="Действия с трекером"
          >
            <template #icon>
              <icon icon="tabler:dots-vertical" />
            </template>
          </n-button>
        </n-dropdown>
      </template>
    </div>

    <n-modal
      v-model:show="isRenameOpen"
      preset="card"
      title="Переименовать трекер"
      size="small"
      :bordered="false"
      class="tracker-item__modal"
    >
      <form
        class="tracker-item__form"
        @submit.prevent="submitRename"
      >
        <n-input
          v-model:value="renameValue"
          :maxlength="MAX_TRACKER_NAME_LENGTH"
          placeholder="Название трекера"
          autofocus
        />

        <div class="tracker-item__form-actions">
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
      :description="`Трекер «${tracker.name}» переедет в историю.`"
      confirm-label="Удалить"
      confirm-color="error"
      confirm-icon="tabler:trash"
      @confirm="confirmRemove"
    />
  </div>
</template>

<style scoped lang="scss">
  .tracker-item {
    display: flex;
    gap: 12px;
    align-items: center;

    padding: 10px;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;

    transition: border-color 0.15s ease-in-out;

    &:not(.tracker-item--readonly):hover {
      border-color: var(--primary);
    }

    &--readonly {
      opacity: 0.6;
    }

    &--disabled {
      pointer-events: none;
      opacity: 0.5;
    }

    &__main {
      display: flex;
      flex: 1 1 auto;
      gap: 12px;
      align-items: center;

      min-width: 0;
      padding: 0;

      color: inherit;
      text-align: left;

      background: transparent;
      border: none;
    }

    .tracker-item:not(.tracker-item--readonly) &__main {
      cursor: pointer;
    }

    &__icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      color: var(--primary);

      &--readonly {
        color: var(--text-g-color);
      }
    }

    &__text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    &__name {
      overflow: hidden;

      font-size: 14px;
      font-weight: 600;
      color: var(--text-color-title);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__activity {
      overflow: hidden;

      font-size: 12px;
      color: var(--text-g-color);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__aside {
      display: flex;
      flex-shrink: 0;
      gap: 6px;
      align-items: center;
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
