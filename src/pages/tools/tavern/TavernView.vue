<script setup lang="ts">
  import { throttle } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import RawContent from '@/shared/ui/RawContent.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  type TavernResult = {
    typeLabel: string;
    territoryLabel: string;
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
  };

  const tavernaType = ref<string | null>(null);
  const territory = ref<string | null>(null);
  const results = ref<Array<TavernResult>>([]);
  const controller = ref<AbortController>();

  const pickRandom = <T,>(items: Array<T>): T =>
    items[Math.floor(Math.random() * items.length)];

  const resolveType = (): string =>
    tavernaType.value ?? pickRandom(['BEER', 'INN', 'HOTEL']);

  const resolveHabitat = (): string =>
    territory.value ??
    pickRandom(
      territories
        .map((item) => item.value)
        .filter((value): value is string => value !== null),
    );

  const territoryLabel = (value: string): string =>
    territories.find((item) => item.value === value)?.label ?? value;

  const generateTavern = throttle(async () => {
    if (controller.value) {
      controller.value.abort();
    }

    controller.value = new AbortController();

    const { signal } = controller.value;
    const resolvedType = resolveType();
    const resolvedHabitat = resolveHabitat();

    try {
      const [
        nameResp,
        menuResp,
        atmosphereResp,
        rumorsResp,
        eventResp,
        tablesResp,
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
          url: '/tools/tavern/tables',
          payload: { tavernaType: resolvedType },
          signal,
        }),
        httpClient.rawGet({
          url: '/tools/tavern/bartender',
          signal,
        }),
      ]);

      const responses = [
        nameResp,
        menuResp,
        atmosphereResp,
        rumorsResp,
        eventResp,
        tablesResp,
        bartenderResp,
      ];

      const failed = responses.find((resp) => resp.status !== 200);

      if (failed) {
        errorHandler(failed.statusText);

        return;
      }

      results.value.unshift({
        typeLabel: typeLabels[resolvedType] ?? resolvedType,
        territoryLabel: territoryLabel(resolvedHabitat),
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
        v-for="(item, key) in results"
        :key="key"
        class="tavern-item"
      >
        <div class="tavern-item__name">
          {{ item.name }}
        </div>

        <div class="tavern-item__meta">
          {{ item.typeLabel }} · {{ item.territoryLabel }}
        </div>

        <div class="tavern-item__section">
          <raw-content :template="item.menu" />
        </div>

        <div class="tavern-item__section">
          <raw-content :template="item.atmosphere" />
        </div>

        <div class="tavern-item__section">
          <raw-content :template="item.rumors" />
        </div>

        <div class="tavern-item__section">
          <raw-content :template="item.event" />
        </div>

        <div class="tavern-item__section">
          <raw-content :template="item.tables" />
        </div>

        <div class="tavern-item__section">
          <raw-content :template="item.bartender" />
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
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--text-g-color);
    }

    &__section {
      &:not(:last-child) {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
      }
    }

    :deep(p) {
      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }
</style>
