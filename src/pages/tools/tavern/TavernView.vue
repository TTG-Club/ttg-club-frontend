<script setup lang="ts">
  import { throttle } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import RawContent from '@/shared/ui/RawContent.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  type RerollField =
    | 'name'
    | 'menu'
    | 'atmosphere'
    | 'rumors'
    | 'event'
    | 'tables'
    | 'bartender';

  type TavernResult = {
    id: number;
    type: string;
    habitat: string;
    typeLabel: string;
    territoryLabel: string;
    atmosphereVisitors: number;
    name: string;
    menu: string;
    atmosphere: string;
    rumors: string;
    event: string;
    tables: string;
    bartender: string;
  };

  const tavernTypes = [
    {
      label: 'Случайный тип',
      value: null,
    },
    {
      label: 'Пивная, кабак, бар',
      value: 'BEER',
    },
    {
      label: 'Постоялый двор, трактир, таверна',
      value: 'INN',
    },
    {
      label: 'Гостиница, отель',
      value: 'HOTEL',
    },
    {
      label: 'Кафе, кофейня, чайная',
      value: 'CAFE',
    },
    {
      label: 'Ресторан, трапезная, харчевня',
      value: 'RESTAURANT',
    },
    {
      label: 'Игорный дом, казино, притон',
      value: 'GAMBLING_DEN',
    },
  ];

  // Значения совпадают с enum HabitatType на бэкенде.
  const territories = [
    { label: 'Случайная территория', value: null },
    { label: 'Лес', value: 'FOREST' },
    { label: 'Болото', value: 'SWAMP' },
    { label: 'Горы', value: 'MOUNTAIN' },
    { label: 'Холмы', value: 'HILL' },
    { label: 'Равнина / луг', value: 'GRASSLAND' },
    { label: 'Побережье', value: 'COAST' },
    { label: 'Полярная тундра', value: 'ARCTIC' },
    { label: 'Пустыня', value: 'DESERT' },
    { label: 'Тропики', value: 'TROPICS' },
    { label: 'Город', value: 'CITY' },
    { label: 'Деревня', value: 'VILLAGE' },
    { label: 'Руины', value: 'RUINS' },
    { label: 'Подземелья', value: 'DUNGEON' },
    { label: 'Подземье', value: 'UNDERGROUND' },
    { label: 'Под водой', value: 'WATERS' },
  ];

  const typeLabels: Record<string, string> = {
    BEER: 'Пивная / бар',
    INN: 'Постоялый двор / таверна',
    HOTEL: 'Гостиница',
    CAFE: 'Кафе',
    RESTAURANT: 'Ресторан',
    GAMBLING_DEN: 'Игорный дом',
  };

  // Блоки результата с кнопкой перегенерации (кроме названия — оно в шапке).
  const sections: Array<{ field: RerollField; title: string }> = [
    { field: 'menu', title: 'Меню' },
    { field: 'atmosphere', title: 'Атмосфера' },
    { field: 'rumors', title: 'Тема разговора' },
    { field: 'event', title: 'Событие' },
    { field: 'tables', title: 'Столики' },
    { field: 'bartender', title: 'Хозяин заведения' },
  ];

  const tavernaType = ref<string | null>(null);
  const territory = ref<string | null>(null);
  const results = ref<Array<TavernResult>>([]);
  const controller = ref<AbortController>();
  const loadingKeys = ref<Set<string>>(new Set());

  let nextId = 0;

  const pickRandom = <T,>(items: Array<T>): T =>
    items[Math.floor(Math.random() * items.length)];

  const resolveType = (): string =>
    tavernaType.value ??
    pickRandom(['BEER', 'INN', 'HOTEL', 'CAFE', 'RESTAURANT', 'GAMBLING_DEN']);

  const resolveHabitat = (): string =>
    territory.value ??
    pickRandom(
      territories
        .map((item) => item.value)
        .filter((value): value is string => value !== null),
    );

  const territoryLabel = (value: string): string =>
    territories.find((item) => item.value === value)?.label ?? value;

  const parseVisitors = (html: string): number => {
    const match = html.match(/data-visitors="(\d+)"/);

    return match ? Number(match[1]) : 0;
  };

  const loadingKey = (item: TavernResult, field: RerollField): string =>
    `${item.id}:${field}`;

  const isLoading = (item: TavernResult, field: RerollField): boolean =>
    loadingKeys.value.has(loadingKey(item, field));

  const setLoading = (key: string, value: boolean) => {
    const next = new Set(loadingKeys.value);

    if (value) {
      next.add(key);
    } else {
      next.delete(key);
    }

    loadingKeys.value = next;
  };

  const requestForField = (item: TavernResult, field: RerollField) => {
    switch (field) {
      case 'name':
        return {
          url: '/tools/tavern/name',
          payload: { tavernaType: item.type },
        };
      case 'menu':
        return {
          url: '/tools/tavern/menu',
          payload: { tavernaType: item.type, habitat: item.habitat },
        };
      case 'atmosphere':
        return { url: '/tools/tavern/atmosphere/' };
      case 'rumors':
        return { url: '/tools/tavern/rumors' };
      case 'event':
        return { url: '/tools/tavern/event' };
      case 'tables':
        return {
          url: '/tools/tavern/tables',
          payload: {
            tavernaType: item.type,
            atmosphereVisitors: item.atmosphereVisitors,
          },
        };
      case 'bartender':
      default:
        return { url: '/tools/tavern/bartender' };
    }
  };

  const rerollField = async (item: TavernResult, field: RerollField) => {
    const key = loadingKey(item, field);

    if (loadingKeys.value.has(key)) {
      return;
    }

    setLoading(key, true);

    try {
      const resp = await httpClient.rawGet(requestForField(item, field));

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      const target = results.value.find((result) => result.id === item.id);

      if (!target) {
        return;
      }

      if (field === 'atmosphere') {
        target.atmosphere = resp.data;
        target.atmosphereVisitors = parseVisitors(resp.data);
      } else {
        target[field] = resp.data;
      }
    } catch (err) {
      errorHandler(err);
    } finally {
      setLoading(key, false);
    }
  };

  const generateTavern = throttle(async () => {
    if (controller.value) {
      controller.value.abort();
    }

    controller.value = new AbortController();

    const { signal } = controller.value;
    const resolvedType = resolveType();
    const resolvedHabitat = resolveHabitat();

    try {
      // Фаза 1: всё, кроме столиков (столикам нужна заполненность из атмосферы).
      const [
        nameResp,
        menuResp,
        atmosphereResp,
        rumorsResp,
        eventResp,
        bartenderResp,
      ] = await Promise.all([
        httpClient.rawGet({
          url: '/tools/tavern/name',
          payload: { tavernaType: resolvedType },
          signal,
        }),
        httpClient.rawGet({
          url: '/tools/tavern/menu',
          payload: { tavernaType: resolvedType, habitat: resolvedHabitat },
          signal,
        }),
        httpClient.rawGet({
          url: '/tools/tavern/atmosphere/',
          signal,
        }),
        httpClient.rawGet({
          url: '/tools/tavern/rumors',
          signal,
        }),
        httpClient.rawGet({
          url: '/tools/tavern/event',
          signal,
        }),
        httpClient.rawGet({
          url: '/tools/tavern/bartender',
          signal,
        }),
      ]);

      const phaseOne = [
        nameResp,
        menuResp,
        atmosphereResp,
        rumorsResp,
        eventResp,
        bartenderResp,
      ];

      const failedOne = phaseOne.find((resp) => resp.status !== 200);

      if (failedOne) {
        errorHandler(failedOne.statusText);

        return;
      }

      // Фаза 2: столики зависят от заполненности зала (visitors из атмосферы).
      const atmosphereVisitors = parseVisitors(atmosphereResp.data);

      const tablesResp = await httpClient.rawGet({
        url: '/tools/tavern/tables',
        payload: { tavernaType: resolvedType, atmosphereVisitors },
        signal,
      });

      if (tablesResp.status !== 200) {
        errorHandler(tablesResp.statusText);

        return;
      }

      results.value.unshift({
        id: (nextId += 1),
        type: resolvedType,
        habitat: resolvedHabitat,
        typeLabel: typeLabels[resolvedType] ?? resolvedType,
        territoryLabel: territoryLabel(resolvedHabitat),
        atmosphereVisitors,
        name: nameResp.data,
        menu: menuResp.data,
        atmosphere: atmosphereResp.data,
        rumors: rumorsResp.data,
        event: eventResp.data,
        tables: tablesResp.data,
        bartender: bartenderResp.data,
      });
    } catch (err) {
      errorHandler(err);
    } finally {
      controller.value = undefined;
    }
  }, 300);
</script>

<template>
  <content-layout title="Таверна">
    <template #fixed>
      <n-form
        class="tools_settings"
        @submit.prevent.stop="generateTavern"
        @keyup.enter.exact.prevent.stop="generateTavern"
      >
        <n-flex>
          <n-form-item
            label="Тип заведения"
            :style="{ minWidth: '254px' }"
          >
            <n-select
              v-model:value="tavernaType"
              :options="tavernTypes"
            />
          </n-form-item>

          <n-form-item
            label="Территория"
            :style="{ minWidth: '254px' }"
          >
            <n-select
              v-model:value="territory"
              :options="territories"
            />
          </n-form-item>
        </n-flex>

        <n-flex>
          <n-button
            type="primary"
            attr-type="submit"
          >
            Сгенерировать
          </n-button>

          <n-button
            secondary
            @click.left.exact.prevent="results = []"
          >
            Очистить
          </n-button>
        </n-flex>
      </n-form>
    </template>

    <template #default>
      <div
        v-if="!results.length"
        class="tavern-empty"
      >
        Выберите тип заведения и территорию, затем сгенерируйте таверну.
      </div>

      <div
        v-for="item in results"
        :key="item.id"
        class="tavern-item"
      >
        <div class="tavern-item__section tavern-item__header">
          <div class="tavern-item__name">
            {{ item.name }}
          </div>

          <div class="tavern-item__meta">
            {{ item.typeLabel }} · {{ item.territoryLabel }}
          </div>

          <n-button
            class="tavern-item__reroll"
            circle
            tertiary
            size="small"
            title="Обновить название"
            :loading="isLoading(item, 'name')"
            @click.left.exact.prevent="rerollField(item, 'name')"
          >
            ↻
          </n-button>
        </div>

        <div
          v-for="section in sections"
          :key="section.field"
          class="tavern-item__section"
        >
          <raw-content :template="item[section.field]" />

          <n-button
            class="tavern-item__reroll"
            circle
            tertiary
            size="small"
            :title="`Обновить: ${section.title}`"
            :loading="isLoading(item, section.field)"
            @click.left.exact.prevent="rerollField(item, section.field)"
          >
            ↻
          </n-button>
        </div>
      </div>
    </template>
  </content-layout>
</template>

<style lang="scss" scoped>
  .tavern-empty,
  .tavern-item {
    width: 100%;
    margin-bottom: 12px;
    padding: 12px;

    background-color: var(--bg-table-list);
    border-radius: 12px;
  }

  .tavern-empty {
    color: var(--text-g-color);
  }

  .tavern-item {
    overflow: hidden;

    &__name {
      font-size: var(--h4-font-size);
      font-weight: 600;
      line-height: var(--h4-line-height);
    }

    &__meta {
      font-size: 14px;
      color: var(--text-g-color);
    }

    &__section {
      position: relative;
      padding-right: 44px;

      &:not(:last-child) {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
      }
    }

    &__reroll {
      position: absolute;
      top: 0;
      right: 0;
    }

    :deep(p) {
      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }
</style>
