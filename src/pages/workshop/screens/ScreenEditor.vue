<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useBookSources } from '@/shared/composable/useBookSources';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    IScreenDetail,
    IScreenSave,
  } from '@/shared/types/workshop/Screens';
  import { UiHtmlEditor } from '@/shared/ui/kit/html-editor';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = defineProps<{
    screen: IScreenDetail;
  }>();

  const router = useRouter();
  const { message } = useDiscreteApi();

  const { source, sourceOptions } = useBookSources(
    props.screen.source?.shortName,
  );

  const form = reactive<IScreenSave>({
    name: props.screen.name.rus,
    englishName: props.screen.name.eng,
    altName: props.screen.altName || '',
    category: props.screen.category || '',
    description: props.screen.description || '',
    icon: props.screen.icon || '',
    order: props.screen.order,
    source: props.screen.source?.shortName,
    parentId: props.screen.parent?.id,
  });

  const pending = ref(false);

  const submit = async () => {
    try {
      pending.value = true;

      const response = await httpClient.patch<IScreenDetail>({
        url: `/workshop/screens/${props.screen.id}`,
        payload: {
          ...form,
          altName: form.altName || undefined,
          category: form.category || undefined,
          description: form.description || undefined,
          icon: form.icon || undefined,
          source: source.value || undefined,
        },
      });

      message.success('Раздел ширмы обновлён');

      await router.push(
        `/workshop/screens/${response.data.name.eng
          .toLowerCase()
          .replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить раздел ширмы');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="screen-editor"
    @submit.prevent="submit"
  >
    <label class="screen-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="screen-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="screen-editor__field">
      <span>Альтернативное название</span>

      <input
        v-model="form.altName"
        type="text"
      />
    </label>

    <label class="screen-editor__field">
      <span>Категория</span>

      <input
        v-model="form.category"
        type="text"
      />
    </label>

    <label class="screen-editor__field">
      <span>Иконка</span>

      <input
        v-model="form.icon"
        type="text"
      />
    </label>

    <label class="screen-editor__field">
      <span>Порядок</span>

      <input
        v-model.number="form.order"
        min="0"
        type="number"
      />
    </label>

    <label class="screen-editor__field">
      <span>Источник</span>

      <n-select
        v-model:value="source"
        :options="sourceOptions"
        clearable
        filterable
      />
    </label>

    <div
      v-if="screen.parent"
      class="screen-editor__readonly"
    >
      <span>Родительский раздел</span>

      <router-link :to="screen.parent.url">
        {{ screen.parent.name.rus }}
      </router-link>
    </div>

    <div class="screen-editor__field screen-editor__field--wide">
      <span>Описание</span>

      <ui-html-editor
        v-model="form.description"
        :rows="18"
      />
    </div>

    <div class="screen-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        Сохранить
      </button>

      <router-link
        :to="`/screens/${screen.name.eng.toLowerCase().replace(/\s+/g, '_')}`"
      >
        Отмена
      </router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .screen-editor {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 16px;

    &__field,
    &__readonly {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &--wide {
        grid-column: 1 / -1;
      }

      span {
        color: var(--text-color);
      }
    }

    &__readonly {
      padding: 10px 12px;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    input,
    textarea {
      width: 100%;
      padding: 10px 12px;

      color: var(--text-b-color);

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    textarea {
      resize: vertical;
    }

    &__actions {
      display: flex;
      grid-column: 1 / -1;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;

      padding-top: 8px;

      button {
        cursor: pointer;

        min-height: 40px;
        padding: 8px 14px;

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

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
