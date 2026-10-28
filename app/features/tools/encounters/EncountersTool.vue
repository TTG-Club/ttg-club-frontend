<script setup lang="ts">
  import type { RollTableData } from '~content/model';

  import { rollTableSchema } from '~content/model';
  import { RollTable } from '~content/roll-table';

  import { useToolGenerator } from '../composables';
  import { ToolGenerator, ToolResultCard } from '../generator';
  import {
    buildEncounterRequest,
    encounterOptionsSchema,
    encounterResultSchema,
    ENCOUNTERS_TEXT,
    TOOLS_API_URL,
    TOOLS_ICON,
  } from '../model';

  /**
   * Генератор случайных столкновений: уровень группы и окружение можно
   * задать или оставить случайными. Для заданных обоих открывается вся
   * таблица с броском.
   */
  const { data: options } = await useAsyncData(
    'tools-encounters-options',
    async () =>
      encounterOptionsSchema.parse(await $fetch(TOOLS_API_URL.encounters)),
    { deep: false },
  );

  const toast = useToast();

  const level = ref<number>();
  const environment = ref<string>();

  const levelItems = computed(() =>
    (options.value?.levels ?? []).map((item) => ({
      label: item.name,
      value: item.value,
    })),
  );

  const environmentItems = computed(() =>
    (options.value?.environments ?? []).map((item) => ({
      label: item.name,
      value: item.value,
    })),
  );

  const { results, isPending, generate, clear } = useToolGenerator(
    async (signal) => [
      encounterResultSchema.parse(
        await $fetch(TOOLS_API_URL.encounters, {
          method: 'POST',
          body: buildEncounterRequest(level.value, environment.value),
          signal,
        }),
      ),
    ],
  );

  const hasResults = computed(() => results.value.length > 0);

  const isTableAvailable = computed(() => !!level.value && !!environment.value);

  const table = shallowRef<RollTableData>();
  const isTableOpen = ref(false);
  const isTableLoading = ref(false);

  /** Загружает таблицу столкновений для выбранных уровня и окружения. */
  async function openTable(): Promise<void> {
    isTableLoading.value = true;

    try {
      table.value = rollTableSchema.parse(
        await $fetch(TOOLS_API_URL.encountersTable, {
          method: 'POST',
          body: buildEncounterRequest(level.value, environment.value),
        }),
      );

      isTableOpen.value = true;
    } catch {
      toast.add({ title: ENCOUNTERS_TEXT.tableError, color: 'error' });
    } finally {
      isTableLoading.value = false;
    }
  }
</script>

<template>
  <ToolGenerator
    :title="ENCOUNTERS_TEXT.title"
    :is-pending="isPending"
    :has-results="hasResults"
    @generate="generate"
    @clear="clear"
  >
    <template #form>
      <UFormField :label="ENCOUNTERS_TEXT.level">
        <USelectMenu
          v-model="level"
          :items="levelItems"
          :placeholder="ENCOUNTERS_TEXT.levelPlaceholder"
          :search-input="false"
          value-key="value"
          clear
          class="w-full"
        />
      </UFormField>

      <UFormField :label="ENCOUNTERS_TEXT.environment">
        <USelectMenu
          v-model="environment"
          :items="environmentItems"
          :placeholder="ENCOUNTERS_TEXT.environmentPlaceholder"
          :search-input="false"
          value-key="value"
          clear
          class="w-full"
        />
      </UFormField>
    </template>

    <template #actions>
      <UButton
        v-if="isTableAvailable"
        :icon="TOOLS_ICON.table"
        :label="ENCOUNTERS_TEXT.showTable"
        :loading="isTableLoading"
        color="neutral"
        variant="subtle"
        @click.left.exact.prevent="openTable"
      />
    </template>

    <ToolResultCard
      v-for="result in results"
      :key="result.id"
      :html="result.value.description"
    >
      <template
        v-if="result.value.source || result.value.tableName"
        #header
      >
        <p v-if="result.value.source">
          <b class="text-highlighted">{{ ENCOUNTERS_TEXT.source }}</b>
          {{ result.value.source.name }}
        </p>

        <p v-if="result.value.tableName">
          <b class="text-highlighted">{{ ENCOUNTERS_TEXT.table }}</b>
          {{ result.value.tableName }}
        </p>
      </template>
    </ToolResultCard>

    <UModal
      v-if="table"
      v-model:open="isTableOpen"
      :title="table.name"
      :ui="{ content: 'max-w-3xl' }"
    >
      <template #body>
        <RollTable :table="table" />
      </template>
    </UModal>
  </ToolGenerator>
</template>
