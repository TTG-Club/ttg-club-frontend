<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { getApiErrorMessage } from '@/shared/utils/apiError';
  import { errorHandler } from '@/shared/utils/errorHandler';
  import { toast } from '@/shared/utils/toast';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  type GenerationType = 'SINGLE' | 'GROUP' | 'FAMILY' | 'CLAN' | 'HOUSE';
  type NameFormat =
    | 'ANY'
    | 'NAME_SURNAME'
    | 'NAME_CLAN'
    | 'NAME_HOUSE'
    | 'NAME_NICKNAME'
    | 'NICKNAME'
    | 'NAME_CLAN_AFFILIATION';
  type Sex = 'MALE' | 'FEMALE';

  const ALL_RACES = 'ALL_RACES' as const;

  type RaceOption = {
    id: number;
    name: string;
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

  const nameFormats = [
    { label: 'Любой', value: 'ANY' },
    { label: 'Имя и фамилия', value: 'NAME_SURNAME' },
    { label: 'Имя и клан', value: 'NAME_CLAN' },
    { label: 'Имя и дом', value: 'NAME_HOUSE' },
    { label: 'Имя и прозвище', value: 'NAME_NICKNAME' },
    { label: 'Только прозвище', value: 'NICKNAME' },
    {
      label: 'Имя и принадлежность к клану',
      value: 'NAME_CLAN_AFFILIATION',
    },
  ];

  const sexLabels: Record<Sex, string> = {
    MALE: 'Мужское',
    FEMALE: 'Женское',
  };

  const metaTagColor = {
    color: 'var(--hover)',
    textColor: 'var(--text-g-color)',
  };

  const type = ref<GenerationType>('SINGLE');
  const format = ref<NameFormat>('ANY');
  const count = ref(5);
  const raceId = ref<number | typeof ALL_RACES>(ALL_RACES);
  const sexes = ref<Array<Sex>>(['MALE', 'FEMALE']);
  const races = ref<Array<RaceOption>>([]);
  const results = ref<Array<GeneratedName>>([]);
  const loading = ref(false);
  const loadingRaces = ref(false);
  const controller = ref<AbortController>();

  const raceOptions = computed(() => [
    {
      label: 'Любая раса',
      value: ALL_RACES,
    },
    ...races.value.map((race) => ({
      label: race.name,
      value: race.id,
    })),
  ]);

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
    if (!sexes.value.length) {
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
          format: format.value,
          count: type.value === 'SINGLE' ? 1 : count.value,
          raceId: raceId.value === ALL_RACES ? null : raceId.value,
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
  <content-layout title="Генератор имён">
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
            <n-select
              v-model:value="raceId"
              :options="raceOptions"
              :loading="loadingRaces"
              filterable
            />
          </n-form-item>

          <n-form-item label="Формат имени">
            <n-select
              v-model:value="format"
              :options="nameFormats"
              :disabled="isSharedGroup"
            />
          </n-form-item>
        </div>

        <n-form-item
          label="Пол"
          :validation-status="sexes.length ? undefined : 'error'"
          :feedback="sexes.length ? undefined : 'Выберите хотя бы один вариант'"
        >
          <n-checkbox-group v-model:value="sexes">
            <n-space>
              <n-checkbox value="MALE">Мужские имена</n-checkbox>

              <n-checkbox value="FEMALE">Женские имена</n-checkbox>
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

        <n-flex>
          <n-button
            type="primary"
            attr-type="submit"
            :loading="loading"
            :disabled="!sexes.length"
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
        </n-flex>
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
  }

  .name-generator-empty,
  .name-generator-item {
    width: 100%;
    padding: 16px;
    background-color: var(--bg-table-list);
    border-radius: 12px;
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
