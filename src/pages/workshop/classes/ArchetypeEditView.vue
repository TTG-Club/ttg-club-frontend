<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    ClassSpellcasterType,
    ClassTableColumn,
    ClassTrait,
  } from '@/shared/types/character/Classes';
  import { UiHtmlEditor } from '@/shared/ui/kit/html-editor';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import PageLayout from '@/layouts/PageLayout.vue';

  import WorkshopRevisions from '../WorkshopRevisions.vue';

  import ClassTableEditor from './ClassTableEditor.vue';

  type ArchetypeEdit = {
    id: number;
    name: string;
    englishName: string;
    genitiveName?: string;
    description: string;
    level: number;
    spellcasterType?: ClassSpellcasterType;
    optionType?: string;
    page?: number;
    traits: ClassTrait[];
    tableColumns: ClassTableColumn[];
  };

  const route = useRoute();
  const { message } = useDiscreteApi();
  const item = ref<ArchetypeEdit>();
  const loading = ref(true);
  const pending = ref(false);

  const addTrait = () =>
    item.value?.traits.push({
      name: '',
      level: 1,
      description: '',
      optional: false,
    });

  const loadArchetype = async () => {
    try {
      const response = await httpClient.post<ArchetypeEdit>({
        url: `/workshop/classes/${route.params.className}/${route.params.archetypeName}`,
        payload: {},
      });

      item.value = {
        ...response.data,
        tableColumns: response.data.tableColumns || [],
      };
    } catch (error) {
      errorHandler(error);
    } finally {
      loading.value = false;
    }
  };

  onBeforeMount(loadArchetype);

  const submit = async () => {
    if (!item.value) {
      return;
    }

    try {
      pending.value = true;

      const response = await httpClient.patch<ArchetypeEdit>({
        url: `/workshop/classes/archetypes/${item.value.id}`,
        payload: {
          ...item.value,
          tableColumns: item.value.tableColumns
            .filter((column) => column.name.trim())
            .map((column) => ({
              ...column,
              name: column.name.trim(),
              prefix: column.prefix?.trim() || undefined,
              suffix: column.suffix?.trim() || undefined,
              levels: column.levels.map((value) => value ?? 0),
            })),
        },
      });

      item.value = {
        ...response.data,
        tableColumns: response.data.tableColumns || [],
      };
      message.success('Архетип обновлён');
    } catch (error) {
      errorHandler(error);
      message.error('Не удалось сохранить архетип');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <page-layout>
    <template #title>Редактирование архетипа</template>

    <div v-if="loading">Загрузка...</div>

    <form
      v-else-if="item"
      class="editor"
      @submit.prevent="submit"
    >
      <label
        ><span>Название</span>

        <input
          v-model="item.name"
          required
      /></label>

      <label
        ><span>Английское название</span>

        <input
          v-model="item.englishName"
          required
      /></label>

      <label
        ><span>Название в родительном падеже</span>

        <input v-model="item.genitiveName"
      /></label>

      <label
        ><span>Уровень получения</span>

        <input
          v-model.number="item.level"
          min="1"
          max="20"
          type="number"
          required
      /></label>

      <div class="field wide">
        <span>Описание</span>

        <ui-html-editor
          v-model="item.description"
          :rows="8"
          required
        />
      </div>

      <section class="wide">
        <div class="heading">
          <h2>Умения архетипа</h2>

          <button
            type="button"
            @click="addTrait"
          >
            Добавить
          </button>
        </div>

        <div
          v-for="(trait, index) in item.traits"
          :key="trait.id || index"
          class="trait"
        >
          <label
            ><span>Уровень</span>

            <input
              v-model.number="trait.level"
              min="1"
              max="20"
              type="number"
          /></label>

          <label
            ><span>Название</span>

            <input v-model="trait.name"
          /></label>

          <label
            ><span>Суффикс</span>

            <input v-model="trait.suffix"
          /></label>

          <button
            type="button"
            @click="item.traits.splice(index, 1)"
          >
            Удалить
          </button>

          <div class="field wide">
            <span>Описание</span>

            <ui-html-editor
              v-model="trait.description"
              :rows="5"
            />
          </div>
        </div>
      </section>

      <class-table-editor
        v-model="item.tableColumns"
        class="wide"
      />

      <div class="actions wide">
        <button
          type="submit"
          :disabled="pending"
        >
          {{ pending ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </form>

    <div v-else>Архетип не найден.</div>

    <workshop-revisions
      v-if="item"
      base-path="/workshop/classes/archetypes"
      :item-id="item.id"
      @restored="loadArchetype"
    />
  </page-layout>
</template>

<style scoped lang="scss">
  .editor {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  label,
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  input,
  textarea {
    padding: 8px;

    color: var(--text-b-color);

    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  .heading,
  .actions {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }
  .trait {
    display: grid;
    grid-template-columns: 100px 1fr 1fr auto;
    gap: 12px;

    margin-top: 12px;
    padding: 12px;

    border: 1px solid var(--border);
    border-radius: 8px;
  }
  button {
    padding: 8px 14px;
  }

  @media (max-width: 700px) {
    .editor,
    .trait {
      grid-template-columns: 1fr;
    }
    .wide {
      grid-column: 1;
    }
  }
</style>
