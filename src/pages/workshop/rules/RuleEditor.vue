<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useBookSources } from '@/shared/composable/useBookSources';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type { RuleDetail, RuleSave } from '@/shared/types/wiki/Rules';
  import { UiHtmlEditor } from '@/shared/ui/kit/html-editor';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = defineProps<{
    rule: RuleDetail;
  }>();

  const router = useRouter();
  const { message } = useDiscreteApi();

  const { source, sourceOptions } = useBookSources(
    props.rule.source?.shortName,
  );

  const form = reactive<RuleSave>({
    name: props.rule.name.rus,
    englishName: props.rule.name.eng,
    altName: props.rule.altName || '',
    type: props.rule.type,
    description: props.rule.description,
    source: props.rule.source?.shortName,
    page: props.rule.source?.page,
  });

  const pending = ref(false);

  const submit = async () => {
    try {
      pending.value = true;

      const response = await httpClient.patch<RuleDetail>({
        url: `/workshop/rules/${props.rule.id}`,
        payload: {
          ...form,
          altName: form.altName || undefined,
          source: source.value || undefined,
          page: form.page || undefined,
        },
      });

      message.success('Правило или термин обновлён');

      await router.push(
        `/workshop/rules/${response.data.name.eng
          .toLowerCase()
          .replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить правило или термин');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="rule-editor"
    @submit.prevent="submit"
  >
    <label class="rule-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="rule-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="rule-editor__field">
      <span>Альтернативное название</span>

      <input
        v-model="form.altName"
        type="text"
      />
    </label>

    <label class="rule-editor__field">
      <span>Категория</span>

      <input
        v-model="form.type"
        required
        type="text"
      />
    </label>

    <label class="rule-editor__field">
      <span>Страница</span>

      <input
        v-model.number="form.page"
        min="1"
        type="number"
      />
    </label>

    <label class="rule-editor__field">
      <span>Источник</span>

      <n-select
        v-model:value="source"
        :options="sourceOptions"
        clearable
        filterable
      />
    </label>

    <div class="rule-editor__field rule-editor__field--wide">
      <span>Описание</span>

      <ui-html-editor
        v-model="form.description"
        :rows="18"
        required
      />
    </div>

    <div class="rule-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        Сохранить
      </button>

      <router-link
        :to="`/rules/${rule.name.eng.toLowerCase().replace(/\s+/g, '_')}`"
      >
        Отмена
      </router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .rule-editor {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 16px;

    &__field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &--wide {
        grid-column: 1 / -1;
      }

      span {
        color: var(--text-color);
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
