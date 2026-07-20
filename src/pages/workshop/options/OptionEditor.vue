<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    OptionDetail,
    OptionSave,
  } from '@/shared/types/character/Options';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      option?: OptionDetail | null;
    }>(),
    {
      option: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

  // Типы особенностей берём из фильтров, чтобы список не расходился с enum на бэке.
  const optionTypeOptions = ref<Array<{ label: string; value: string }>>([]);

  const loadOptionTypes = async () => {
    try {
      const resp = await httpClient.post<{
        other?: Array<{
          key: string;
          values: Array<{ key: string; label: string }>;
        }>;
      }>({
        url: '/filters/options',
      });

      const classOption = resp.data.other?.find(
        ({ key }) => key === 'classOption',
      );

      optionTypeOptions.value = (classOption?.values || []).map(
        ({ key, label }) => ({
          label,
          value: key,
        }),
      );
    } catch (err) {
      errorHandler(err);
    }
  };

  const form = reactive<OptionSave>({
    name: props.option?.name.rus || '',
    englishName: props.option?.name.eng || '',
    altName: props.option?.altName || '',
    optionTypes: props.option?.optionTypes || [],
    prerequisite:
      props.option?.prerequisite === 'Нет'
        ? ''
        : props.option?.prerequisite || '',
    level: props.option?.level,
    description: props.option?.description || '',
  });

  const pending = ref(false);
  const isEdit = computed(() => !!props.option?.id);

  const submit = async () => {
    if (!form.optionTypes.length) {
      message.error('Выберите хотя бы один тип особенности');

      return;
    }

    try {
      pending.value = true;

      const payload = {
        ...form,
        altName: form.altName || undefined,
        level: form.level || undefined,
        prerequisite: form.prerequisite || undefined,
      };

      const resp = isEdit.value
        ? await httpClient.patch<OptionDetail>({
            url: `/workshop/options/${props.option?.id}`,
            payload,
          })
        : await httpClient.post<OptionDetail>({
            url: '/workshop/options',
            payload,
          });

      message.success(
        isEdit.value ? 'Особенность обновлена' : 'Особенность создана',
      );

      await router.push(
        `/workshop/options/${resp.data.name.eng
          .toLowerCase()
          .replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить особенность');
    } finally {
      pending.value = false;
    }
  };

  onBeforeMount(loadOptionTypes);
</script>

<template>
  <form
    class="option-editor"
    @submit.prevent="submit"
  >
    <label class="option-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="option-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="option-editor__field">
      <span>Альтернативное название</span>

      <input
        v-model="form.altName"
        type="text"
      />
    </label>

    <label class="option-editor__field">
      <span>Требования</span>

      <input
        v-model="form.prerequisite"
        type="text"
      />
    </label>

    <label class="option-editor__field">
      <span>Уровень</span>

      <input
        v-model.number="form.level"
        min="1"
        type="number"
      />
    </label>

    <label class="option-editor__field option-editor__field--wide">
      <span>Типы особенности</span>

      <n-select
        v-model:value="form.optionTypes"
        :options="optionTypeOptions"
        clearable
        filterable
        multiple
      />
    </label>

    <label class="option-editor__field option-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        required
        rows="12"
      />
    </label>

    <div class="option-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/options">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .option-editor {
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
      select,
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
