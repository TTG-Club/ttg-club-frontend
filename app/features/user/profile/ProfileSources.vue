<script setup lang="ts">
  import type { FilterGroup, FilterSelection } from '~section/model';

  import { isEqual, xor } from 'es-toolkit';

  import { SectionFilterCard } from '~section/filter-drawer';
  import {
    getDefaultSelection,
    getExcludedSources,
    getGroupSelection,
    setGroupSelection,
    SOURCES_PARAM,
  } from '~section/model';

  import {
    getApiErrorMessage,
    getDefaultSources,
    PROFILE_ICON,
    PROFILE_SOURCES_KEY,
    PROFILE_TEXT,
    saveDefaultSources,
  } from '../model';

  /**
   * Источники по умолчанию: книги, с которыми открываются фильтры
   * источников во всех разделах.
   */
  const { fetchProfile } = useUser();

  const toast = useToast();

  // Ручке нужна cookie посетителя, поэтому книги грузятся в браузере
  const {
    data: definition,
    status,
    refresh,
  } = useLazyAsyncData(PROFILE_SOURCES_KEY, getDefaultSources, {
    server: false,
    deep: false,
  });

  const selection = ref<FilterSelection>({});

  const isSubmitting = ref(false);

  const isLoading = computed(() => status.value === 'pending');

  const isFailed = computed(() => status.value === 'error');

  const allKeys = computed(
    () =>
      definition.value?.sources.flatMap((group) =>
        group.values.map((value) => String(value.key)),
      ) ?? [],
  );

  const excluded = computed(() =>
    definition.value
      ? getExcludedSources(definition.value, selection.value)
      : [],
  );

  const savedExcluded = computed(() =>
    definition.value
      ? getExcludedSources(
          definition.value,
          getDefaultSelection(definition.value),
        )
      : [],
  );

  const isUnchanged = computed(() =>
    isEqual(excluded.value, savedExcluded.value),
  );

  const isNothingSelected = computed(
    () =>
      !!allKeys.value.length && excluded.value.length === allKeys.value.length,
  );

  const isAllSelected = computed(() => !excluded.value.length);

  // После загрузки и сохранения выбор встаёт на сохранённый
  watch(
    definition,
    (value) => {
      selection.value = value ? getDefaultSelection(value) : {};
    },
    { immediate: true },
  );

  /**
   * Выбранные книги группы.
   * @param group - группа книг
   */
  function getSelected(group: FilterGroup): Array<string> {
    return getGroupSelection(selection.value, group);
  }

  /**
   * Заменяет выбор группы целиком, например через «Выбрать все» группы.
   * @param group - группа книг
   * @param keys - выбранные книги
   */
  function setGroup(group: FilterGroup, keys: Array<string>): void {
    selection.value = setGroupSelection(selection.value, group, keys);
  }

  /**
   * Отмечает книгу или снимает отметку.
   * @param group - группа книг
   * @param key - книга
   */
  function toggle(group: FilterGroup, key: string): void {
    setGroup(group, xor(getSelected(group), [key]));
  }

  function selectAll(): void {
    selection.value = { ...selection.value, [SOURCES_PARAM]: allKeys.value };
  }

  /** Сохраняет выбор и перечитывает профиль, чтобы разделы его подхватили. */
  async function save(): Promise<void> {
    isSubmitting.value = true;

    try {
      await saveDefaultSources(excluded.value);
      await Promise.all([refresh(), fetchProfile()]);

      toast.add({
        title: PROFILE_TEXT.sourcesSaved,
        color: 'success',
        icon: PROFILE_ICON.saved,
      });
    } catch (error) {
      toast.add({
        title: PROFILE_TEXT.sourcesFailed,
        description: getApiErrorMessage(error, ''),
        color: 'error',
        icon: PROFILE_ICON.failed,
      });
    } finally {
      isSubmitting.value = false;
    }
  }
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          :name="PROFILE_ICON.sources"
          class="size-5 text-primary"
        />

        {{ PROFILE_TEXT.sources }}
      </h2>
    </template>

    <div class="flex flex-col gap-4">
      <p class="text-sm text-muted">
        {{ PROFILE_TEXT.sourcesHelp }}
      </p>

      <div
        v-if="isLoading && !definition"
        class="flex flex-col gap-3"
      >
        <USkeleton class="h-24 w-full" />

        <USkeleton class="h-24 w-full" />
      </div>

      <p
        v-else-if="isFailed"
        class="text-sm text-error"
      >
        {{ PROFILE_TEXT.sourcesLoadFailed }}
      </p>

      <template v-else-if="definition">
        <SectionFilterCard
          v-for="group in definition.sources"
          :key="group.key"
          :group="group"
          :values="group.values"
          :selected="getSelected(group)"
          is-sources
          @toggle="toggle(group, $event)"
          @update:selected="setGroup(group, $event)"
        />

        <div class="flex flex-wrap items-center justify-end gap-2">
          <span
            v-if="isNothingSelected"
            class="mr-auto text-sm text-error"
          >
            {{ PROFILE_TEXT.sourcesNoneSelected }}
          </span>

          <UButton
            :label="PROFILE_TEXT.sourcesSelectAll"
            :icon="PROFILE_ICON.selectAll"
            :disabled="isAllSelected"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="selectAll"
          />

          <UButton
            :label="PROFILE_TEXT.save"
            :loading="isSubmitting"
            :disabled="isUnchanged || isNothingSelected"
            @click.left.exact.prevent="save"
          />
        </div>
      </template>
    </div>
  </UCard>
</template>
