<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useBookSources } from '@/shared/composable/useBookSources';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type { Filter, FilterGroup } from '@/shared/composable/useFilter';
  import type { GodEdit, GodSave, GodSex } from '@/shared/types/wiki/Gods';
  import { UiHtmlEditor } from '@/shared/ui/kit/html-editor';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = defineProps<{
    god: GodEdit;
  }>();

  const router = useRouter();
  const { message } = useDiscreteApi();
  const { source, sourceOptions } = useBookSources(props.god.source);

  const form = reactive<GodSave>({
    name: props.god.name,
    englishName: props.god.englishName,
    altName: props.god.altName || '',
    commitment: props.god.commitment || '',
    sex: props.god.sex,
    rank: props.god.rank,
    alignment: props.god.alignment,
    description: props.god.description || '',
    alternativeDescription: props.god.alternativeDescription || '',
    symbol: props.god.symbol || '',
    nicknames: props.god.nicknames || '',
    domains: [...props.god.domains],
    pantheonId: props.god.pantheonId,
    source: props.god.source,
    page: props.god.page,
  });

  const sexOptions: Array<{ label: string; value: GodSex }> = [
    { label: 'Бог', value: 'MALE' },
    { label: 'Богиня', value: 'FEMALE' },
    { label: 'Философия', value: 'PHILOSOPHY' },
    { label: 'Божество', value: 'UNDEFINE' },
  ];

  const filter = ref<Filter>();
  const pending = ref(false);

  const groupOptions = (key: string) => {
    const group = filter.value?.other.find(
      (item: FilterGroup) => item.key === key,
    );

    return (group?.values || []).map((item) => ({
      label: item.label,
      value: item.key,
    }));
  };

  const alignmentOptions = computed(() => groupOptions('alignment'));
  const domainOptions = computed(() => groupOptions('domain'));
  const rankOptions = computed(() => groupOptions('rank'));
  const pantheonOptions = computed(() => groupOptions('pantheon'));

  const loadOptions = async () => {
    try {
      const response = await httpClient.post<Filter>({
        url: '/filters/gods',
        payload: {},
      });

      filter.value = response.data;
    } catch (err) {
      errorHandler(err);
    }
  };

  const submit = async () => {
    try {
      pending.value = true;

      const response = await httpClient.patch<GodEdit>({
        url: `/workshop/gods/${props.god.id}`,
        payload: {
          ...form,
          altName: form.altName || undefined,
          commitment: form.commitment || undefined,
          description: form.description || undefined,
          alternativeDescription: form.alternativeDescription || undefined,
          symbol: form.symbol || undefined,
          nicknames: form.nicknames || undefined,
          source: source.value || undefined,
          page: form.page || undefined,
        },
      });

      message.success('Божество обновлено');

      await router.push(
        `/workshop/gods/${response.data.englishName
          .toLowerCase()
          .replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить божество');
    } finally {
      pending.value = false;
    }
  };

  onBeforeMount(loadOptions);
</script>

<template>
  <form
    class="god-editor"
    @submit.prevent="submit"
  >
    <label class="god-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="god-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="god-editor__field">
      <span>Альтернативное название</span>

      <input
        v-model="form.altName"
        type="text"
      />
    </label>

    <label class="god-editor__field">
      <span>Сфера влияния</span>

      <input
        v-model="form.commitment"
        type="text"
      />
    </label>

    <label class="god-editor__field">
      <span>Тип</span>

      <n-select
        v-model:value="form.sex"
        :options="sexOptions"
      />
    </label>

    <label class="god-editor__field">
      <span>Ранг</span>

      <n-select
        v-model:value="form.rank"
        :options="rankOptions"
      />
    </label>

    <label class="god-editor__field">
      <span>Мировоззрение</span>

      <n-select
        v-model:value="form.alignment"
        :options="alignmentOptions"
      />
    </label>

    <label class="god-editor__field">
      <span>Пантеон</span>

      <n-select
        v-model:value="form.pantheonId"
        :options="pantheonOptions"
        filterable
      />
    </label>

    <label class="god-editor__field god-editor__field--wide">
      <span>Домены</span>

      <n-select
        v-model:value="form.domains"
        :options="domainOptions"
        filterable
        multiple
      />
    </label>

    <label class="god-editor__field">
      <span>Символ</span>

      <input
        v-model="form.symbol"
        type="text"
      />
    </label>

    <label class="god-editor__field">
      <span>Титулы (через запятую)</span>

      <input
        v-model="form.nicknames"
        type="text"
      />
    </label>

    <label class="god-editor__field">
      <span>Страница</span>

      <input
        v-model.number="form.page"
        min="1"
        type="number"
      />
    </label>

    <label class="god-editor__field">
      <span>Источник</span>

      <n-select
        v-model:value="source"
        :options="sourceOptions"
        clearable
        filterable
      />
    </label>

    <div class="god-editor__field god-editor__field--wide">
      <span>Описание</span>

      <ui-html-editor
        v-model="form.description"
        :rows="18"
      />
    </div>

    <div class="god-editor__field god-editor__field--wide">
      <span>Альтернативное описание</span>

      <ui-html-editor
        v-model="form.alternativeDescription"
        :rows="12"
      />
    </div>

    <div class="god-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        Сохранить
      </button>

      <router-link
        :to="`/gods/${god.englishName.toLowerCase().replace(/\s+/g, '_')}`"
      >
        Отмена
      </router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .god-editor {
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

      input {
        width: 100%;
        padding: 10px 12px;

        color: var(--text-b-color);

        background-color: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 8px;
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
