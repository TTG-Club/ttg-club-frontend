<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    TRevisionInfo,
    TRevisionOperation,
  } from '@/shared/types/workshop/Revision';
  import { errorHandler } from '@/shared/utils/errorHandler';
  import { getDateString } from '@/shared/utils/getDateString';

  const props = defineProps<{
    /** Базовый путь workshop-ресурса, например `/workshop/spells`. */
    basePath: string;
    itemId: number;
  }>();

  const emit = defineEmits<{
    (e: 'restored'): void;
  }>();

  const { message, dialog } = useDiscreteApi();

  const revisions = ref<TRevisionInfo[]>([]);
  const loading = ref(false);
  const restoring = ref<number | null>(null);

  const operationLabels: Record<TRevisionOperation, string> = {
    CREATE: 'Создание',
    UPDATE: 'Изменение',
    DELETE: 'Удаление',
  };

  const loadRevisions = async () => {
    try {
      loading.value = true;

      const resp = await httpClient.get<TRevisionInfo[]>({
        url: `${props.basePath}/${props.itemId}/revisions`,
      });

      revisions.value = resp.data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  };

  const restore = (revision: number) => {
    dialog.warning({
      title: 'Восстановление из ревизии',
      content: `Заменить текущее состояние данными ревизии №${revision}?`,
      positiveText: 'Восстановить',
      negativeText: 'Отмена',
      onPositiveClick: async () => {
        try {
          restoring.value = revision;

          await httpClient.post({
            url: `${props.basePath}/${props.itemId}/revisions/${revision}/restore`,
          });

          message.success('Восстановлено из ревизии');
          emit('restored');
          await loadRevisions();
        } catch (err) {
          errorHandler(err);
          message.error('Не удалось восстановить');
        } finally {
          restoring.value = null;
        }
      },
    });
  };

  onBeforeMount(loadRevisions);
</script>

<template>
  <section class="workshop-revisions">
    <h3 class="workshop-revisions__title">История изменений</h3>

    <div v-if="loading">Загрузка истории...</div>

    <div v-else-if="!revisions.length">Ревизий пока нет.</div>

    <ul
      v-else
      class="workshop-revisions__list"
    >
      <li
        v-for="rev in revisions"
        :key="rev.revision"
        class="workshop-revisions__item"
      >
        <div class="workshop-revisions__meta">
          <span class="workshop-revisions__num">№{{ rev.revision }}</span>

          <span class="workshop-revisions__op">
            {{ operationLabels[rev.operation] }}
          </span>

          <span class="workshop-revisions__author">{{ rev.username }}</span>

          <span class="workshop-revisions__date">
            {{ getDateString(rev.createdAt, 'LLL') }}
          </span>
        </div>

        <button
          class="workshop-revisions__restore"
          :disabled="restoring !== null"
          type="button"
          @click="restore(rev.revision)"
        >
          Восстановить
        </button>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
  .workshop-revisions {
    margin-top: 24px;

    &__title {
      margin-bottom: 12px;
      color: var(--text-color);
    }

    &__list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      margin: 0;
      padding: 0;

      list-style: none;
    }

    &__item {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;

      padding: 10px 12px;

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;

      color: var(--text-color);
    }

    &__num {
      font-weight: 600;
      color: var(--text-b-color);
    }

    &__author {
      color: var(--text-b-color);
    }

    &__date {
      color: var(--text-g-color);
    }

    &__restore {
      cursor: pointer;

      min-height: 32px;
      padding: 6px 12px;

      color: var(--text-b-color);

      background-color: var(--primary);
      border: 0;
      border-radius: 8px;

      &:disabled {
        cursor: wait;
        opacity: 0.7;
      }
    }
  }
</style>
