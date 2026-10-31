<script setup lang="ts">
  import type { MadnessRequest } from '../model';

  import { useToolGenerator } from '../composables';
  import {
    ToolChip,
    ToolCountField,
    ToolGenerator,
    ToolResultCard,
    ToolResultGrid,
  } from '../generator';
  import {
    MADNESS_TEXT,
    madnessResultSchema,
    madnessTypesSchema,
    normalizeToolCount,
    TOOL_COUNT_MIN,
    TOOLS_API_URL,
  } from '../model';

  /**
   * Генератор безумия: вид можно выбрать или оставить случайным, длительность
   * выбрасывает бэкенд.
   */
  const { data: types } = await useAsyncData(
    'tools-madness-types',
    async () => madnessTypesSchema.parse(await $fetch(TOOLS_API_URL.madness)),
    { deep: false, default: () => [] },
  );

  const count = ref(TOOL_COUNT_MIN);
  const selectedType = ref<string>();

  const { results, isPending, generate, clear, remove } = useToolGenerator(
    async (signal) => {
      const body: MadnessRequest = {
        count: normalizeToolCount(count.value),
        ...(selectedType.value ? { type: selectedType.value } : {}),
      };

      return madnessResultSchema
        .array()
        .parse(
          await $fetch(TOOLS_API_URL.madness, { method: 'POST', body, signal }),
        );
    },
  );

  const hasResults = computed(() => results.value.length > 0);

  /**
   * Выбирает вид или снимает выбор: без вида он случайный.
   * @param value - вид безумия
   */
  function toggleType(value: string): void {
    selectedType.value = selectedType.value === value ? undefined : value;
  }
</script>

<template>
  <ToolGenerator
    :title="MADNESS_TEXT.title"
    :is-pending="isPending"
    :has-results="hasResults"
    @generate="generate"
    @clear="clear"
  >
    <template #form>
      <ToolCountField v-model="count" />

      <UFormField
        v-if="types.length"
        :label="MADNESS_TEXT.types"
      >
        <div class="flex flex-wrap gap-2">
          <ToolChip
            v-for="type in types"
            :key="type.value"
            :label="type.name"
            :is-selected="selectedType === type.value"
            @toggle="toggleType(type.value)"
          />
        </div>
      </UFormField>
    </template>

    <ToolResultGrid>
      <ToolResultCard
        v-for="result in results"
        :key="result.id"
        :html="result.value.description"
        @close="remove(result.id)"
      >
        <template #header>
          <p>
            <b class="text-highlighted">{{ MADNESS_TEXT.type }}</b>
            {{ result.value.type.name }}
          </p>

          <p v-if="result.value.type.additional">
            <b class="text-highlighted">{{ MADNESS_TEXT.duration }}</b>
            {{ result.value.type.additional }}
          </p>
        </template>
      </ToolResultCard>
    </ToolResultGrid>
  </ToolGenerator>
</template>
