<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { getApiErrorMessage } from '@/shared/utils/apiError';
  import { errorHandler } from '@/shared/utils/errorHandler';
  import { toast } from '@/shared/utils/toast';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  type GenerationType = 'SINGLE' | 'GROUP' | 'FAMILY' | 'CLAN' | 'HOUSE';
  type NameComponent =
    | 'NAME'
    | 'SURNAME'
    | 'NICKNAME'
    | 'CLAN'
    | 'HOUSE'
    | 'FROM';
  type Sex = 'MALE' | 'FEMALE' | 'UNISEX';

  const ALL_RACES = 'ALL_RACES' as const;

  type RaceOption = {
    id: number;
    name: string;
    parentId: number | null;
    available: boolean;
  };

  type RaceTreeOption = {
    key: number | typeof ALL_RACES;
    label: string;
    children?: Array<RaceTreeOption>;
  };

  type GeneratedName = {
    value: string;
    race: string;
    sex: Sex | null;
  };

  const generationTypes = [
    { label: 'Один персонаж', value: 'SINGLE' },
    { label: 'Группа', value: 'GROUP' },
    { label: 'Семья', value: 'FAMILY' },
    { label: 'Клан', value: 'CLAN' },
    { label: 'Дом', value: 'HOUSE' },
  ];

  const nameComponentOptions = [
    { label: 'Имя', value: 'NAME' },
    { label: 'Фамилия', value: 'SURNAME' },
    { label: 'Прозвище', value: 'NICKNAME' },
    { label: 'Клан', value: 'CLAN' },
    { label: 'Дом', value: 'HOUSE' },
    { label: 'Место', value: 'FROM' },
  ];

  const sexLabels: Record<Sex, string> = {
    MALE: 'Мужское',
    FEMALE: 'Женское',
    UNISEX: 'Универсальное',
  };

  const metaTagColor = {
    color: 'var(--hover)',
    textColor: 'var(--text-g-color)',
  };

  const type = ref<GenerationType>('SINGLE');

  const components = ref<Array<NameComponent>>([
    'NAME',
    'SURNAME',
    'NICKNAME',
    'CLAN',
    'HOUSE',
    'FROM',
  ]);

  const count = ref(5);
  const raceIds = ref<Array<number | typeof ALL_RACES>>([ALL_RACES]);
  const sexes = ref<Array<Sex>>(['MALE', 'FEMALE']);
  const races = ref<Array<RaceOption>>([]);
  const results = ref<Array<GeneratedName>>([]);
  const loading = ref(false);
  const loadingRaces = ref(false);
  const controller = ref<AbortController>();

  const raceOptions = computed<Array<RaceTreeOption>>(() => {
    const nodes = new Map<number, RaceTreeOption>();
    const roots: Array<RaceTreeOption> = [];

    for (const race of races.value) {
      nodes.set(race.id, {
        key: race.id,
        label: race.name,
        children: [],
      });
    }

    for (const race of [...races.value].sort((a, b) =>
      a.name.localeCompare(b.name, 'ru'),
    )) {
      const node = nodes.get(race.id)!;
      const parent = race.parentId ? nodes.get(race.parentId) : undefined;

      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return [
      {
        key: ALL_RACES,
        label: 'Любая раса',
      },
      ...roots,
    ];
  });

  const selectedRaceIds = computed(() => {
    const available = new Set(
      races.value.filter((race) => race.available).map((race) => race.id),
    );

    return raceIds.value.filter(
      (id): id is number => typeof id === 'number' && available.has(id),
    );
  });

  const isSharedGroup = computed(
    () =>
      type.value === 'FAMILY' ||
      type.value === 'CLAN' ||
      type.value === 'HOUSE',
  );

  const effectiveFormatHint = computed(() => {
    if (type.value === 'FAMILY') {
      return 'Для всех членов семьи будет использована одна фамилия.';
    }

    if (type.value === 'CLAN') {
      return 'Для всех участников будет использован один клан.';
    }

    if (type.value === 'HOUSE') {
      return 'Для всех участников будет использован один дом.';
    }

    return null;
  });

  const onRaceIdsUpdate = (
    value: string | number | Array<string | number> | null,
  ) => {
    const values: Array<string | number> = Array.isArray(value) ? value : [];

    if (!Array.isArray(value) && value != null) {
      values.push(value);
    }

    const hadAllRaces = raceIds.value.includes(ALL_RACES);
    const hasAllRaces = values.includes(ALL_RACES);

    if (hasAllRaces && !hadAllRaces) {
      raceIds.value = [ALL_RACES];

      return;
    }

    const selected = values.filter(
      (id): id is number => typeof id === 'number',
    );

    raceIds.value = selected.length ? selected : [ALL_RACES];
  };

  const loadRaces = async () => {
    loadingRaces.value = true;

    try {
      const response = await httpClient.get<Array<RaceOption>>({
        url: '/tools/names',
      });

      races.value = response.data;
    } catch (error) {
      errorHandler(error);
      toast.error(getApiErrorMessage(error, 'Не удалось загрузить список рас'));
    } finally {
      loadingRaces.value = false;
    }
  };

  const generate = async () => {
    if (
      !sexes.value.length ||
      (!isSharedGroup.value && !components.value.length)
    ) {
      return;
    }

    controller.value?.abort();
    controller.value = new AbortController();
    loading.value = true;

    try {
      const response = await httpClient.post<Array<GeneratedName>>({
        url: '/tools/names',
        payload: {
          type: type.value,
          components: components.value,
          count: type.value === 'SINGLE' ? 1 : count.value,
          raceIds: selectedRaceIds.value.length ? selectedRaceIds.value : null,
          sexes: sexes.value,
        },
        signal: controller.value.signal,
      });

      results.value = response.data;
    } catch (error) {
      errorHandler(error);
      toast.error(getApiErrorMessage(error, 'Не удалось сгенерировать имена'));
    } finally {
      controller.value = undefined;
      loading.value = false;
    }
  };

  onBeforeMount(loadRaces);
</script>

<template>
  <content-layout
    title="Генератор имён"
    class="name-generator-layout"
  >
    <template #fixed>
      <n-form
        class="name-generator-form"
        label-placement="top"
        @submit.prevent.stop="generate"
        @keyup.enter.exact.prevent.stop="generate"
      >
        <div class="name-generator-form__grid">
          <n-form-item label="Генерация">
            <n-select
              v-model:value="type"
              :options="generationTypes"
            />
          </n-form-item>

          <n-form-item
            v-if="type !== 'SINGLE'"
            label="Количество"
          >
            <n-input-number
              v-model:value="count"
              :min="1"
              :max="100"
            />
          </n-form-item>

          <n-form-item label="Раса">
            <n-tree-select
              :value="raceIds"
              class="name-generator-form__races"
              :options="raceOptions"
              :loading="loadingRaces"
              cascade
              checkable
              check-strategy="all"
              clearable
              default-expand-all
              filterable
              multiple
              max-tag-count="responsive"
              placeholder="Любая раса"
              @update:value="onRaceIdsUpdate"
            />
          </n-form-item>

          <n-form-item
            label="Состав имени"
            :validation-status="
              components.length || isSharedGroup ? undefined : 'error'
            "
            :feedback="
              components.length || isSharedGroup
                ? undefined
                : 'Выберите хотя бы один вариант'
            "
          >
            <n-select
              v-model:value="components"
              class="name-generator-form__components"
              :options="nameComponentOptions"
              :disabled="isSharedGroup"
              clearable
              multiple
              max-tag-count="responsive"
              placeholder="Выберите состав имени"
            />
          </n-form-item>
        </div>

        <n-form-item
          label="Пол"
          :validation-status="sexes.length ? undefined : 'error'"
          :feedback="sexes.length ? undefined : 'Выберите хотя бы один вариант'"
        >
          <n-checkbox-group v-model:value="sexes">
            <n-space class="name-generator-form__sexes">
              <n-checkbox value="MALE">Мужчина</n-checkbox>

              <n-checkbox value="FEMALE">Женщина</n-checkbox>

              <n-checkbox value="UNISEX">Универсальные</n-checkbox>
            </n-space>
          </n-checkbox-group>
        </n-form-item>

        <n-text
          v-if="effectiveFormatHint"
          depth="3"
          class="name-generator-form__hint"
        >
          {{ effectiveFormatHint }}
        </n-text>

        <div class="name-generator-form__actions">
          <n-button
            type="primary"
            attr-type="submit"
            :loading="loading"
            :disabled="!sexes.length || (!isSharedGroup && !components.length)"
          >
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
        class="name-generator-empty"
      >
        Настройте параметры и сгенерируйте имена персонажей или существ.
      </div>

      <div
        v-else
        class="name-generator-results"
      >
        <article
          v-for="item in results"
          :key="item.value"
          class="name-generator-item"
        >
          <div class="name-generator-item__value">
            {{ item.value }}
          </div>

          <n-flex
            size="small"
            class="name-generator-item__meta"
          >
            <n-tag
              size="small"
              :bordered="false"
              :color="metaTagColor"
            >
              {{ item.race }}
            </n-tag>

            <n-tag
              v-if="item.sex"
              size="small"
              :bordered="false"
              :color="metaTagColor"
            >
              {{ sexLabels[item.sex] }}
            </n-tag>
          </n-flex>
        </article>
      </div>
    </template>
  </content-layout>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .name-generator-form {
    :deep(.n-form-item) {
      min-width: 0;
    }

    :deep(.n-input-number) {
      width: 100%;
    }

    &__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0 16px;

      @include media-min($md) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    &__hint {
      display: block;
      margin: -4px 0 16px;
    }

    &__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      @include media-max($sm) {
        display: grid;
        grid-template-columns: 1fr;

        :deep(.n-button) {
          width: 100%;
        }
      }
    }

    &__sexes {
      max-width: 100%;
    }

    &__components,
    &__races {
      :deep(.n-tag) {
        --n-color: var(--hover) !important;
        --n-text-color: var(--text-color) !important;
        --n-border: 1px solid var(--border) !important;
        --n-close-icon-color: var(--text-g-color) !important;
        --n-close-icon-color-hover: var(--text-color) !important;
      }
    }
  }

  .name-generator-layout {
    @include media-max($md) {
      :deep(.content-layout__fixed) {
        position: static;
      }
    }
  }

  .name-generator-empty,
  .name-generator-item {
    width: 100%;
    padding: 16px;
    background-color: var(--bg-table-list);
    border-radius: 12px;

    @include media-max($sm) {
      padding: 12px;
    }
  }

  .name-generator-empty {
    color: var(--text-g-color);
  }

  .name-generator-results {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;

    @include media-min($md) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .name-generator-item {
    min-width: 0;

    &__value {
      font-size: var(--h4-font-size);
      font-weight: 600;
      line-height: var(--h4-line-height);
      overflow-wrap: anywhere;
    }

    &__meta {
      margin-top: 12px;
    }
  }
</style>
