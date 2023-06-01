<template>
  <content-layout
    :show-right-side="showRightSide"
    :force-fullscreen-state="false"
  >
    <template #fixed>
      <form
        class="tools_settings"
        @submit.prevent="sendForm"
      >
        <div class="tools_settings__row">
          <div class="tools_settings__column">
            <div class="row">
              <span class="label">Количество магии в мире:</span>

              <ui-select
                v-model="magicLevel"
                :options="config.magicLevels"
                label="name"
                track-by="value"
              >
                <template #placeholder>
                  Количество
                </template>
              </ui-select>
            </div>

            <div class="row">
              <span class="label">Результат проверки Харизмы (Убеждение):</span>

              <ui-input
                v-model="form.persuasion"
                class="form-control select"
                type="number"
                :min="1"
                :max="50"
                placeholder="Харизма (Убеждение)"
              />
            </div>
          </div>
        </div>

        <div
          v-if="settings.opened"
          class="tools_settings__row"
        >
          <div class="tools_settings__column">
            <div class="row">
              <div class="tools_settings__row">
                <ui-checkbox
                  :model-value="form.unique"
                  type="toggle"
                  @update:model-value="updateUnique"
                >
                  Только уникальные
                </ui-checkbox>
              </div>

              <div
                v-if="!form.unique"
                class="tools_settings__row"
              >
                <ui-checkbox
                  :model-value="settings.grouping"
                  type="toggle"
                  @update:model-value="updateGrouping"
                >
                  Группировать одинаковые
                </ui-checkbox>
              </div>

              <div
                v-if="!form.unique && settings.grouping"
                class="tools_settings__row"
              >
                <ui-checkbox
                  :model-value="settings.max"
                  type="toggle"
                  @update:model-value="updateUsingMaxPrice"
                >
                  Отображать максимальную цену
                </ui-checkbox>
              </div>
            </div>

            <div
              v-if="config.sources.length"
              class="row align-right"
            >
              <div class="tools_settings__row">
                <span class="label">Источники:</span>

                <div class="checkbox-group">
                  <ui-switch
                    track-by="shortName"
                    label="shortName"
                    :model-value="settings.priceSource"
                    :options="config.sources"
                    @update:model-value="updatePriceSource"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="tools_settings__row btn-wrapper">
          <ui-button @click.left.exact.prevent="sendForm()">
            Найти торговца
          </ui-button>

          <ui-button @click.left.exact.prevent="settings.opened = !settings.opened">
            Настройки
          </ui-button>
        </div>
      </form>
    </template>

    <template #right-side>
      <content-detail>
        <template #fixed>
          <section-header
            :subtitle="selected.item?.name.eng || 'On sale'"
            :title="selected.item?.name.rus || 'В продаже'"
            @close="close"
          />
        </template>

        <template #default>
          <div
            v-if="!selected.item"
            class="content-padding trader__empty"
          >
            <p>Список товаров пуст.</p>
          </div>

          <div
            v-else
            class="trader__content"
          >
            <spell-body
              v-if="detailCard.spell"
              :spell="detailCard.spell"
            />

            <magic-item-body :magic-item="detailCard.item" />
          </div>
        </template>
      </content-detail>
    </template>

    <template #default>
      <magic-item-link
        v-for="(item, key) in groupedResults"
        :key="item.url + key"
        :is-active="selected.index === key"
        :magic-item="item"
        :to="{ path: item.url }"
        in-tools
        in-trader
        @select-item="selectItem(key)"
      />
    </template>
  </content-layout>
</template>

<script setup lang="ts">
  import {
    computed, ref, toRaw
  } from 'vue';
  import max from 'lodash/max';
  import mean from 'lodash/mean';
  import sortedUniq from 'lodash/sortedUniq';
  import throttle from 'lodash/throttle';
  import groupBy from 'lodash/groupBy';
  import { storeToRefs } from 'pinia';
  import { tryOnBeforeMount } from '@vueuse/core';
  import toNumber from 'lodash/toNumber';
  import localforage from 'localforage';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import UiSelect from '@/components/UI/kit/UiSelect.vue';
  import SectionHeader from '@/components/UI/SectionHeader.vue';
  import UiCheckbox from '@/components/UI/kit/UiCheckbox.vue';
  import MagicItemBody from '@/views/Inventory/MagicItems/MagicItemBody.vue';
  import SpellBody from '@/views/Character/Spells/SpellBody.vue';
  import MagicItemLink from '@/views/Inventory/MagicItems/MagicItemLink.vue';
  import errorHandler from '@/common/helpers/errorHandler';
  import ContentDetail from '@/components/content/ContentDetail.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import UiInput from '@/components/UI/kit/UiInput.vue';
  import UiButton from '@/components/UI/kit/button/UiButton.vue';
  import UiSwitch from '@/components/UI/kit/UiSwitch.vue';
  import { useAxios } from '@/common/composition/useAxios';
  import type { TNameValue, TSource } from '@/types/Shared/BaseApiFields.types';
  import type { TSpellItem } from '@/types/Character/Spells.types';
  import type { TArtifactItem } from '@/types/Inventory/MagicItems.types';
  import type { TGroupedTraderLink, TTraderLink } from '@/types/Tools/Trader.types';
  import { DB_NAME } from '@/common/const/UI';

  type TConfig = {
    magicLevels: Array<TNameValue<number>>;
    sources: Array<TSource>
  }

  const http = useAxios();
  const uiStore = useUIStore();
  const { fullscreen, isMobile } = storeToRefs(uiStore);

  const store = localforage.createInstance({
    name: DB_NAME,
    storeName: 'trader'
  });

  const config = ref<TConfig>({
    magicLevels: [],
    sources: []
  });

  const form = ref<{
    magicLevel: number;
    persuasion: number;
    unique: boolean;
  }>({
    magicLevel: 1,
    persuasion: 1,
    unique: true
  });

  const settings = ref<{
    opened: boolean;
    grouping: boolean;
    max: boolean;
    priceSource?: TSource
  }>({
    opened: !isMobile.value,
    grouping: true,
    max: false
  });

  const results = ref<Array<TTraderLink>>([]);

  const detailCard = ref<{
    item?: TArtifactItem;
    spell?: TSpellItem
  }>({});

  const selected = ref<{
    index?: number;
    item?: TArtifactItem
  }>({});

  const loading = ref(false);
  const error = ref(false);

  const controllers = ref(new AbortController());

  const showRightSide = ref(false);

  const magicLevel = computed<TNameValue<number>>({
    get: () => config.value.magicLevels.find(el => el.value === form.value.magicLevel),
    set: v => {
      form.value.magicLevel = v.value;
    }
  });

  const groupedResults = computed(() => {
    const getCurrentPrice = (price: Record<string, number | null>) => {
      if (!price) {
        return null;
      }

      const priceKey = settings.value.priceSource?.shortName;

      if (!priceKey) {
        return null;
      }

      const currentPrice = price[priceKey.toLowerCase()];
      const formatted = toNumber(currentPrice);

      return Number.isNaN(formatted)
        ? null
        : formatted;
    };

    if (!settings.value.grouping) {
      return results.value.map(item => {
        if (!item.price) {
          return item;
        }

        return {
          ...item,
          custom: {
            price: getCurrentPrice(toRaw(item.price))
          }
        };
      });
    }

    const getGroupPrice = (group: Array<TTraderLink>) => {
      const prices = sortedUniq(group
        .map(o => {
          if (!o.price) {
            return null;
          }

          return getCurrentPrice(toRaw(o.price));
        })
        .filter(price => typeof price === 'number'));

      return settings.value.max
        ? max(prices)
        : Math.round(mean(prices));
    };

    const groups = Object.values<Array<TTraderLink>>(groupBy(results.value, o => o.name.rus));
    const res: Array<TGroupedTraderLink> = [];

    for (const group of groups) {
      const el = group[0];

      res.push({
        ...el,
        custom: {
          count: group.length,
          price: getGroupPrice(group)
        }
      });
    }

    return res;
  });

  const clearSelected = () => {
    selected.value.index = undefined;
    selected.value.item = undefined;
    detailCard.value.item = undefined;
    detailCard.value.spell = undefined;
  };

  const updateUnique = async (value: boolean) => {
    try {
      await store.ready();

      form.value.unique = value;

      return store.setItem<boolean>('unique', value);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const restoreUnique = async () => {
    try {
      await store.ready();

      const restored = await store.getItem<boolean>('unique');
      const value = restored !== null ? restored : true;

      await updateUnique(value);

      return restored;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const updateGrouping = async (value: boolean) => {
    try {
      await store.ready();

      settings.value.grouping = value;

      return store.setItem<boolean>('grouping', value);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const restoreGrouping = async () => {
    try {
      await store.ready();

      const restored = await store.getItem<boolean>('grouping');
      const value = restored !== null ? restored : true;

      await updateGrouping(value);

      return restored;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const updateUsingMaxPrice = async (value: boolean) => {
    try {
      await store.ready();

      settings.value.max = value;

      return store.setItem<boolean>('maxPrice', value);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const restoreUsingMaxPrice = async () => {
    try {
      await store.ready();

      const restored = await store.getItem<boolean>('maxPrice');
      const value = restored !== null ? restored : false;

      await updateUsingMaxPrice(value);

      return restored;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const restorePriceSource = async (sources: Array<TSource>) => {
    try {
      if (!sources.length) {
        return undefined;
      }

      if (sources.length < 2) {
        return sources[0];
      }

      await store.ready();

      const sourceKey = await store.getItem<TSource['shortName']>('priceSource');

      if (!sourceKey) {
        return sources[0];
      }

      const oldSource = sources.find(source => source.shortName === sourceKey);

      if (!oldSource) {
        return sources[0];
      }

      settings.value.priceSource = oldSource;

      return oldSource;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const updatePriceSource = async (source: TSource) => {
    try {
      await store.ready();

      settings.value.priceSource = source;

      return store.setItem<TSource['shortName']>('priceSource', source.shortName);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const getConfig = async () => {
    try {
      const resp = await http.get<TConfig>({
        url: '/tools/trader'
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      config.value = resp.data as TConfig;
      settings.value.priceSource = await restorePriceSource(resp.data.sources);
    } catch (err) {
      errorHandler(err);
    }
  };

  const sendForm = throttle(async () => {
    loading.value = true;

    if (controllers.value instanceof AbortController) {
      controllers.value.abort();
    }

    controllers.value = new AbortController();

    const options = {
      ...form.value,
      persuasion: form.value.persuasion || 1
    };

    try {
      const {
        status, statusText, data
      } = await http.post<Array<TTraderLink>>({
        url: '/tools/trader',
        payload: options,
        signal: controllers.value.signal
      });

      if (status !== 200) {
        errorHandler(statusText);

        return;
      }

      clearSelected();

      results.value = data as Array<TTraderLink>;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  }, 300);

  const getItemDetail = async <T, L>(url: L['url']): Promise<T> => {
    try {
      const {
        status, statusText, data
      } = await http.post<T>({ url });

      if (status !== 200) {
        error.value = true;

        return Promise.reject(statusText);
      }

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const selectItem = async index => {
    try {
      error.value = false;

      clearSelected();

      const item = groupedResults.value[index];

      detailCard.value.item = await getItemDetail<TArtifactItem, TTraderLink>(item.url);

      if (item.spell?.url) {
        detailCard.value.spell = await getItemDetail<TSpellItem, TTraderLink['spell']>(item.spell.url);
      }

      selected.value = {
        index,
        item
      };

      showRightSide.value = true;
    } catch (err) {
      error.value = true;

      clearSelected();
      errorHandler(err);
    }
  };

  const close = () => {
    showRightSide.value = false;
  };

  tryOnBeforeMount(async () => {
    showRightSide.value = !isMobile.value;

    await restoreUnique();
    await restoreGrouping();
    await restoreUsingMaxPrice();
    await getConfig();
  });
</script>
