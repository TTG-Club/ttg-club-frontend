<script setup lang="ts">
  import {
    groupBy,
    max,
    mean,
    sortedUniq,
    throttle,
    toNumber,
  } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type { TNameValue, TSource } from '@/shared/types/BaseApiFields';
  import type { TSpellItem, TSpellLink } from '@/shared/types/character/Spells';
  import type {
    TArtifactItem,
    TArtifactLink,
  } from '@/shared/types/inventory/MagicItems';
  import type {
    TGroupedTraderLink,
    TTraderItem,
    TTraderLink,
  } from '@/shared/types/tools/Trader';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import SpellBody from '@/pages/character/spells/spells-detail/SpellBody.vue';
  import MagicItemBody from '@/pages/inventory/magic-items/magic-items-detail/MagicItemBody.vue';
  import MagicItemLink from '@/pages/inventory/magic-items/MagicItemLink.vue';

  type TConfig = {
    magicLevels: Array<TNameValue<number>>;
    sources: Array<TSource>;
  };

  const uiStore = useUIStore();
  const { isMobile } = storeToRefs(uiStore);

  const config = ref<TConfig>({
    magicLevels: [],
    sources: [],
  });

  const form = ref<{
    magicLevel: number;
    persuasion: number;
    unique: boolean;
  }>({
    magicLevel: 1,
    persuasion: 1,
    unique: false,
  });

  const settings = ref<{
    opened: boolean;
    grouping: boolean;
    max: boolean;
    priceSource?: TSource['shortName'];
  }>({
    opened: !isMobile.value,
    grouping: true,
    max: false,
  });

  const results = ref<Array<TTraderLink>>([]);

  const detailCard = ref<{
    item?: TArtifactItem;
    spell?: TSpellItem;
  }>({});

  const selected = ref<{
    index?: number;
    item?: TGroupedTraderLink;
  }>({});

  const loading = ref(false);
  const loadingDetail = ref(false);
  const error = ref(false);

  const controllers = ref(new AbortController());

  const showRightSide = ref(false);

  const groupedResults = computed<Array<TGroupedTraderLink>>(() => {
    const getCurrentPrice = (price: Record<string, number | null>) => {
      if (!price) {
        return null;
      }

      const priceKey = settings.value.priceSource;

      if (!priceKey) {
        return null;
      }

      const currentPrice = price[priceKey.toLowerCase()];
      const formatted = toNumber(currentPrice);

      return Number.isNaN(formatted) ? null : formatted;
    };

    if (!settings.value.grouping) {
      return results.value.map((item) => {
        if (!item.price) {
          return item;
        }

        return {
          ...item,
          custom: {
            price: getCurrentPrice(toRaw(item.price)),
          },
        };
      });
    }

    const getGroupPrice = (group: Array<TTraderLink>) => {
      const prices = sortedUniq(
        group
          .map((o) => {
            if (!o.price) {
              return null;
            }

            return getCurrentPrice(toRaw(o.price));
          })
          .filter((price) => typeof price === 'number'),
      );

      const res = settings.value.max ? max(prices) : Math.round(mean(prices));

      return typeof res !== 'number' ? null : res;
    };

    const groups = Object.values<Array<TTraderLink>>(
      groupBy(results.value, (o) => o.name.rus),
    );

    const res: Array<TGroupedTraderLink> = [];

    for (const group of groups) {
      const el = group[0];

      res.push({
        ...el,
        custom: {
          count: group.length,
          price: getGroupPrice(group),
        },
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

  const getConfig = async () => {
    try {
      const resp = await httpClient.get<TConfig>({
        url: '/tools/trader',
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      config.value = resp.data;
      settings.value.priceSource = resp.data.sources[0].shortName;
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
      persuasion: form.value.persuasion || 1,
    };

    try {
      const { status, statusText, data } = await httpClient.post<
        Array<TTraderLink>
      >({
        url: '/tools/trader',
        payload: options,
        signal: controllers.value.signal,
      });

      if (status !== 200) {
        errorHandler(statusText);

        return;
      }

      clearSelected();

      results.value = data;
    } catch (err) {
      errorHandler(err);
    } finally {
      loading.value = false;
    }
  }, 300);

  const getItemDetail = async <T extends { url: string }, R>(
    url: T['url'],
  ): Promise<R> => {
    try {
      const { status, statusText, data } = await httpClient.post<R>({ url });

      if (status !== 200) {
        error.value = true;

        return Promise.reject(statusText);
      }

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const selectItem = async (index: number) => {
    loadingDetail.value = true;

    try {
      error.value = false;

      clearSelected();

      const item = groupedResults.value[index];

      detailCard.value.item = await getItemDetail<TArtifactLink, TTraderItem>(
        item.url,
      );

      if (item.spell?.url) {
        detailCard.value.spell = await getItemDetail<TSpellLink, TSpellItem>(
          item.spell.url,
        );
      }

      selected.value = {
        index,
        item,
      };

      showRightSide.value = true;
    } catch (err) {
      error.value = true;

      clearSelected();
      errorHandler(err);
    } finally {
      loadingDetail.value = false;
    }
  };

  const close = () => {
    showRightSide.value = false;
  };

  tryOnBeforeMount(async () => {
    showRightSide.value = !isMobile.value;

    await getConfig();
  });
</script>

<template>
  <content-layout
    :show-right-side="showRightSide"
    :force-fullscreen-state="false"
  >
    <template #fixed>
      <n-form
        class="tools_settings"
        @submit.stop.prevent="sendForm"
      >
        <n-grid
          cols="1 350:3"
          :x-gap="12"
        >
          <n-form-item-gi
            span="3"
            label="Проверка харизмы (Убеждение)"
          >
            <n-input-number
              v-model:value="form.persuasion"
              :min="1"
            />
          </n-form-item-gi>

          <n-form-item-gi
            span="2"
            label="Количество магии"
          >
            <n-select
              v-model:value="form.magicLevel"
              value-field="value"
              label-field="name"
              :options="config.magicLevels"
            />
          </n-form-item-gi>

          <n-form-item-gi
            span="1"
            label="Источник цены"
          >
            <n-radio-group v-model:value="settings.priceSource">
              <n-radio-button
                v-for="source in config.sources"
                :key="source.shortName"
                :value="source.shortName"
                :label="source.shortName"
              />
            </n-radio-group>
          </n-form-item-gi>
        </n-grid>

        <n-space vertical>
          <n-collapse-transition :show="settings.opened">
            <n-space vertical>
              <n-checkbox
                v-model:checked="form.unique"
                :focusable="false"
              >
                Только уникальные
              </n-checkbox>

              <n-checkbox
                v-model:checked="settings.grouping"
                :focusable="false"
                :disabled="form.unique"
              >
                Группировать одинаковые
              </n-checkbox>

              <n-checkbox
                v-model:checked="settings.max"
                :focusable="false"
                :disabled="form.unique || !settings.grouping"
              >
                Отображать максимальную цену
              </n-checkbox>
            </n-space>
          </n-collapse-transition>

          <n-space>
            <n-button
              type="primary"
              :focusable="false"
              @click.left.exact.prevent="sendForm"
            >
              Найти торговца
            </n-button>

            <n-button
              secondary
              :focusable="false"
              @click.left.exact.prevent="settings.opened = !settings.opened"
            >
              Настройки
            </n-button>
          </n-space>
        </n-space>
      </n-form>
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

    <template #right-side>
      <content-detail>
        <template #fixed>
          <section-header
            :subtitle="selected.item?.name.eng || 'On sale'"
            @close="close"
          >
            <template #title>
              <n-skeleton
                v-if="loadingDetail"
                round
                :width="250"
              />

              <template v-else-if="selected.item?.name.rus">
                <n-performant-ellipsis>
                  {{ selected.item.name.rus }}
                </n-performant-ellipsis>
              </template>

              <template v-else> В продаже </template>
            </template>

            <template #subtitle>
              <n-skeleton
                v-if="loadingDetail"
                round
                text
                :width="150"
              />

              <template v-else-if="selected.item?.name.eng">
                <n-performant-ellipsis>
                  {{ selected.item.name.eng }}
                </n-performant-ellipsis>
              </template>

              <template v-else> On sale </template>
            </template>
          </section-header>
        </template>

        <template #default>
          <div
            v-if="loadingDetail"
            class="content-padding"
          >
            <n-skeleton
              text
              round
              :repeat="2"
            />

            <n-skeleton
              text
              round
              :repeat="2"
              width="70%"
            />

            <n-skeleton
              text
              round
              width="30%"
            />
          </div>

          <div
            v-else-if="!selected.item"
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
  </content-layout>
</template>
