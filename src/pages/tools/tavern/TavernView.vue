<script setup lang="ts">
  import { throttle } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
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
    serviceLevel: string;
    typeLabel: string;
    territoryLabel: string;
    serviceLevelLabel: string;
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

  // Значения совпадают с enum TavernaCategory на бэкенде (уровень цен меню).
  const serviceLevels = [
    { label: 'Случайный уровень', value: null },
    { label: 'Дешёвое', value: 'CHEAP' },
    { label: 'Обычное', value: 'ORDINARY' },
    { label: 'Дорогое', value: 'EXPENSIVE' },
    { label: 'Элитное', value: 'ELITE' },
  ];

  const serviceLevelLabels: Record<string, string> = {
    CHEAP: 'Дешёвое',
    ORDINARY: 'Обычное',
    EXPENSIVE: 'Дорогое',
    ELITE: 'Элитное',
  };

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
  const serviceLevel = ref<string | null>(null);
  const results = ref<Array<TavernResult>>([]);
  const controller = ref<AbortController>();
  const loadingKeys = ref<Set<string>>(new Set());
  const isGenerating = ref(false);

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

  const resolveServiceLevel = (): string =>
    serviceLevel.value ??
    pickRandom(['CHEAP', 'ORDINARY', 'EXPENSIVE', 'ELITE']);

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
          payload: {
            tavernaType: item.type,
            habitat: item.habitat,
            serviceLevel: item.serviceLevel,
          },
        };
      case 'atmosphere':
        return { url: '/tools/tavern/atmosphere/' };
      case 'rumors':
        return {
          url: '/tools/tavern/rumors',
          payload: { atmosphereVisitors: item.atmosphereVisitors },
        };
      case 'event':
        return {
          url: '/tools/tavern/event',
          payload: { atmosphereVisitors: item.atmosphereVisitors },
        };
      case 'tables':
        return {
          url: '/tools/tavern/tables',
          payload: {
            tavernaType: item.type,
            atmosphereVisitors: item.atmosphereVisitors,
            serviceLevel: item.serviceLevel,
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
    controller.value?.abort();

    const currentController = new AbortController();

    controller.value = currentController;
    isGenerating.value = true;

    const { signal } = currentController;
    const resolvedType = resolveType();
    const resolvedHabitat = resolveHabitat();
    const resolvedServiceLevel = resolveServiceLevel();

    try {
      // Фаза 1: не зависит от заполненности зала.
      const [nameResp, menuResp, atmosphereResp, bartenderResp] =
        await Promise.all([
          httpClient.rawGet({
            url: '/tools/tavern/name',
            payload: { tavernaType: resolvedType },
            signal,
          }),
          httpClient.rawGet({
            url: '/tools/tavern/menu',
            payload: {
              tavernaType: resolvedType,
              habitat: resolvedHabitat,
              serviceLevel: resolvedServiceLevel,
            },
            signal,
          }),
          httpClient.rawGet({
            url: '/tools/tavern/atmosphere/',
            signal,
          }),
          httpClient.rawGet({
            url: '/tools/tavern/bartender',
            signal,
          }),
        ]);

      const phaseOne = [nameResp, menuResp, atmosphereResp, bartenderResp];
      const failedOne = phaseOne.find((resp) => resp.status !== 200);

      if (failedOne) {
        errorHandler(failedOne.statusText);

        return;
      }

      // Заполненность зала из атмосферы — от неё зависят слухи, событие и столики.
      const atmosphereVisitors = parseVisitors(atmosphereResp.data);

      // Фаза 2.
      const [rumorsResp, eventResp, tablesResp] = await Promise.all([
        httpClient.rawGet({
          url: '/tools/tavern/rumors',
          payload: { atmosphereVisitors },
          signal,
        }),
        httpClient.rawGet({
          url: '/tools/tavern/event',
          payload: { atmosphereVisitors },
          signal,
        }),
        httpClient.rawGet({
          url: '/tools/tavern/tables',
          payload: {
            tavernaType: resolvedType,
            atmosphereVisitors,
            serviceLevel: resolvedServiceLevel,
          },
          signal,
        }),
      ]);

      const phaseTwo = [rumorsResp, eventResp, tablesResp];
      const failedTwo = phaseTwo.find((resp) => resp.status !== 200);

      if (failedTwo) {
        errorHandler(failedTwo.statusText);

        return;
      }

      results.value.unshift({
        id: (nextId += 1),
        type: resolvedType,
        habitat: resolvedHabitat,
        serviceLevel: resolvedServiceLevel,
        typeLabel: typeLabels[resolvedType] ?? resolvedType,
        territoryLabel: territoryLabel(resolvedHabitat),
        serviceLevelLabel:
          serviceLevelLabels[resolvedServiceLevel] ?? resolvedServiceLevel,
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
      if (controller.value === currentController) {
        controller.value = undefined;
        isGenerating.value = false;
      }
    }
  }, 300);
</script>

<template>
  <content-layout
    title="Таверна"
    class="tavern-layout"
  >
    <template #fixed>
      <n-form
        class="tools_settings tavern-settings"
        @submit.prevent.stop="generateTavern"
        @keyup.enter.exact.prevent.stop="generateTavern"
      >
        <p class="tavern-settings__hint">
          Задайте детали или оставьте их случайными — генератор соберёт готовое
          место для приключения.
        </p>

        <div class="tavern-settings__grid">
          <n-form-item label="Тип заведения">
            <n-select
              v-model:value="tavernaType"
              :options="tavernTypes"
              placeholder="Тип заведения"
            />
          </n-form-item>

          <n-form-item label="Территория">
            <n-select
              v-model:value="territory"
              :options="territories"
              placeholder="Территория"
            />
          </n-form-item>

          <n-form-item label="Уровень обслуживания">
            <n-select
              v-model:value="serviceLevel"
              :options="serviceLevels"
              placeholder="Уровень обслуживания"
            />
          </n-form-item>
        </div>

        <div class="tavern-settings__actions">
          <n-button
            type="primary"
            attr-type="submit"
            :loading="isGenerating"
          >
            <template #icon>
              <svg-icon icon="dice/d20" />
            </template>
            Сгенерировать
          </n-button>

          <n-button
            secondary
            :disabled="!results.length"
            @click.left.exact.prevent="results = []"
          >
            Очистить
          </n-button>
        </div>
      </n-form>
    </template>

    <template #default>
      <div
        v-if="!results.length"
        class="tavern-empty"
      >
        <svg-icon
          class="tavern-empty__icon"
          icon="dice/d20"
          size="32"
        />

        <p class="tavern-empty__title">Здесь появится ваша таверна</p>

        <p class="tavern-empty__text">
          Выберите параметры или доверьтесь случаю, затем запустите генерацию.
        </p>
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

          <n-space
            class="tavern-item__meta"
            size="small"
          >
            <n-tag
              :bordered="false"
              size="small"
              >{{ item.typeLabel }}</n-tag
            >

            <n-tag
              :bordered="false"
              size="small"
              >{{ item.territoryLabel }}</n-tag
            >

            <n-tag
              :bordered="false"
              size="small"
              >{{ item.serviceLevelLabel }}</n-tag
            >
          </n-space>

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
          <raw-content
            class="tavern-item__section-content"
            :template="item[section.field]"
          />

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
  @use '@/assets/styles/variables/breakpoints' as *;

  .tavern-layout {
    @include media-max($md) {
      :deep(.content-layout__fixed) {
        position: static;
      }
    }
  }

  .tavern-settings {
    &__hint {
      margin: 0 0 16px;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-g-color);
    }

    &__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0 16px;

      @include media-min($md) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    &__actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 180px));
      gap: 8px;

      :deep(.n-button) {
        width: 100%;
      }

      @include media-max($sm) {
        display: grid;
        grid-template-columns: 1fr;

        :deep(.n-button) {
          width: 100%;
        }
      }
    }
  }

  .tavern-empty,
  .tavern-item {
    width: 100%;
    margin-bottom: 16px;
    padding: 16px;

    background-color: var(--bg-table-list);
    border-radius: 12px;

    @include media-max($sm) {
      padding: 12px;
    }
  }

  .tavern-empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    min-height: 180px;

    color: var(--text-g-color);

    &__icon {
      margin-bottom: 16px;
      color: var(--primary);
    }

    &__title {
      margin: 0 0 4px;

      font-size: var(--h4-font-size);
      font-weight: 600;
      line-height: var(--h4-line-height);
      color: var(--text-color-title);
    }

    &__text {
      max-width: 520px;
      margin: 0;
      line-height: 1.5;
    }
  }

  .tavern-item {
    overflow: hidden;
    border: 1px solid var(--border);
    box-shadow: 0 0.625rem 0.75rem 0 var(--card-shadow);

    &__name {
      padding-right: 36px;

      font-size: var(--h4-font-size);
      font-weight: 600;
      line-height: var(--h4-line-height);
      color: var(--text-color-title);
      overflow-wrap: anywhere;
    }

    &__meta {
      margin-top: 12px;

      :deep(.n-tag) {
        --n-color: var(--hover) !important;
        --n-text-color: var(--text-g-color) !important;
        --n-border: 1px solid var(--border) !important;
      }
    }

    &__section {
      position: relative;
      padding: 16px 44px 0 0;

      &:not(:last-child) {
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--hover);
      }
    }

    &__section-content {
      color: var(--text-color);
    }

    &__reroll {
      position: absolute;
      top: 16px;
      right: 0;
    }

    &__header {
      padding-top: 0;
    }

    :deep(p) {
      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }
</style>
