<script setup lang="ts">
  import type {
    Tavern,
    TavernBase,
    TavernField,
    TavernHabitat,
    TavernServiceLevel,
    TavernType,
    ToolResult,
  } from '../model';

  import { useToolGenerator } from '../composables';
  import { ToolGenerator } from '../generator';
  import {
    getTavernRequest,
    parseTavernVisitors,
    patchTavern,
    resolveTavernSettings,
    TAVERN_HABITATS,
    TAVERN_SERVICE_LEVELS,
    TAVERN_TEXT,
    TAVERN_TYPES,
    tavernHtmlSchema,
    TOOLS_API_URL,
    TOOLS_TEXT,
  } from '../model';
  import TavernCard from './TavernCard.vue';

  /**
   * Генератор таверны: название, меню, атмосфера, слухи, событие, столики и
   * хозяин. Пустые настройки выбираются случайно, любую часть можно обновить.
   */
  const toast = useToast();

  const typeItems = [...TAVERN_TYPES];
  const habitatItems = [...TAVERN_HABITATS];
  const serviceLevelItems = [...TAVERN_SERVICE_LEVELS];

  const type = ref<TavernType>();
  const habitat = ref<TavernHabitat>();
  const serviceLevel = ref<TavernServiceLevel>();

  /** Обновляемые части по ключу результата. */
  const pending = ref<Record<number, Array<TavernField>>>({});

  /**
   * Загружает одну часть таверны.
   * @param field - часть таверны
   * @param tavern - настройки и заполненность зала
   * @param signal - отмена запроса
   */
  async function fetchPart(
    field: TavernField,
    tavern: TavernBase,
    signal?: AbortSignal,
  ): Promise<string> {
    const { path, query } = getTavernRequest(field, tavern);

    return tavernHtmlSchema.parse(
      await $fetch(`${TOOLS_API_URL.tavern}/${path}`, {
        query,
        signal,
        responseType: 'text',
      }),
    );
  }

  const { results, isPending, generate, clear, remove } = useToolGenerator(
    async (signal): Promise<Array<Tavern>> => {
      const settings = resolveTavernSettings({
        type: type.value,
        habitat: habitat.value,
        serviceLevel: serviceLevel.value,
      });

      const empty: TavernBase = { ...settings, visitors: 0 };

      const [name, menu, atmosphere, bartender] = await Promise.all([
        fetchPart('name', empty, signal),
        fetchPart('menu', empty, signal),
        fetchPart('atmosphere', empty, signal),
        fetchPart('bartender', empty, signal),
      ]);

      // Слухи, событие и столики зависят от заполненности зала из атмосферы
      const base: TavernBase = {
        ...settings,
        visitors: parseTavernVisitors(atmosphere),
      };

      const [rumors, event, tables] = await Promise.all([
        fetchPart('rumors', base, signal),
        fetchPart('event', base, signal),
        fetchPart('tables', base, signal),
      ]);

      return [
        { ...base, name, menu, atmosphere, bartender, rumors, event, tables },
      ];
    },
  );

  const hasResults = computed(() => results.value.length > 0);

  /**
   * Отмечает, что часть таверны обновляется или уже обновлена.
   * @param id - ключ результата
   * @param field - часть таверны
   * @param isActive - обновляется ли часть
   */
  function setPending(id: number, field: TavernField, isActive: boolean): void {
    const fields = (pending.value[id] ?? []).filter((item) => item !== field);

    pending.value = {
      ...pending.value,
      [id]: isActive ? [...fields, field] : fields,
    };
  }

  /**
   * Перегенерирует одну часть таверны.
   * @param result - таверна
   * @param field - часть таверны
   */
  async function reroll(
    result: ToolResult<Tavern>,
    field: TavernField,
  ): Promise<void> {
    if (pending.value[result.id]?.includes(field)) {
      return;
    }

    setPending(result.id, field, true);

    try {
      const html = await fetchPart(field, result.value);

      results.value = results.value.map((item) =>
        item.id === result.id
          ? { id: item.id, value: patchTavern(item.value, field, html) }
          : item,
      );
    } catch {
      toast.add({ title: TOOLS_TEXT.error, color: 'error' });
    } finally {
      setPending(result.id, field, false);
    }
  }

  /**
   * Убирает таверну из списка вместе с отметками обновления.
   * @param id - ключ результата
   */
  function close(id: number): void {
    remove(id);

    const { [id]: _removed, ...rest } = pending.value;

    pending.value = rest;
  }

  function clearAll(): void {
    clear();
    pending.value = {};
  }
</script>

<template>
  <ToolGenerator
    :title="TAVERN_TEXT.title"
    :is-pending="isPending"
    :has-results="hasResults"
    @generate="generate"
    @clear="clearAll"
  >
    <template #form>
      <UFormField :label="TAVERN_TEXT.type">
        <USelectMenu
          v-model="type"
          :items="typeItems"
          :placeholder="TAVERN_TEXT.typePlaceholder"
          :search-input="false"
          value-key="value"
          clear
          class="w-full"
        />
      </UFormField>

      <UFormField :label="TAVERN_TEXT.habitat">
        <USelectMenu
          v-model="habitat"
          :items="habitatItems"
          :placeholder="TAVERN_TEXT.habitatPlaceholder"
          :search-input="false"
          value-key="value"
          clear
          class="w-full"
        />
      </UFormField>

      <UFormField :label="TAVERN_TEXT.serviceLevel">
        <USelectMenu
          v-model="serviceLevel"
          :items="serviceLevelItems"
          :placeholder="TAVERN_TEXT.serviceLevelPlaceholder"
          :search-input="false"
          value-key="value"
          clear
          class="w-full"
        />
      </UFormField>
    </template>

    <TavernCard
      v-for="result in results"
      :key="result.id"
      :tavern="result.value"
      :pending="pending[result.id]"
      @reroll="reroll(result, $event)"
      @close="close(result.id)"
    />
  </ToolGenerator>
</template>
