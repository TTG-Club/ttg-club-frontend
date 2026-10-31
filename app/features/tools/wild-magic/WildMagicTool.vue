<script setup lang="ts">
  import type { WildMagicRequest } from '../model';

  import { useToolGenerator } from '../composables';
  import {
    ToolChip,
    ToolCountField,
    ToolGenerator,
    ToolResultCard,
    ToolResultGrid,
  } from '../generator';
  import {
    getDefaultSources,
    normalizeToolCount,
    toggleRequired,
    TOOL_COUNT_MIN,
    TOOLS_API_URL,
    WILD_MAGIC_DEFAULT_SOURCE,
    WILD_MAGIC_TEXT,
    wildMagicResultSchema,
    wildMagicSourcesSchema,
  } from '../model';

  /**
   * Генератор дикой магии: эффекты из выбранных книг, хотя бы одна книга
   * выбрана всегда.
   */
  const { data: sources } = await useAsyncData(
    'tools-wild-magic-sources',
    async () =>
      wildMagicSourcesSchema
        .parse(await $fetch(TOOLS_API_URL.wildMagic))
        .reverse(),
    { deep: false, default: () => [] },
  );

  const count = ref(TOOL_COUNT_MIN);

  const selected = ref<Array<string>>([]);

  watch(
    sources,
    (value) => {
      selected.value = getDefaultSources(
        value.map((source) => source.shortName),
        WILD_MAGIC_DEFAULT_SOURCE,
      );
    },
    { immediate: true },
  );

  const { results, isPending, generate, clear, remove } = useToolGenerator(
    async (signal) => {
      const body: WildMagicRequest = {
        count: normalizeToolCount(count.value),
        sources: selected.value,
      };

      return wildMagicResultSchema.array().parse(
        await $fetch(TOOLS_API_URL.wildMagic, {
          method: 'POST',
          body,
          signal,
        }),
      );
    },
  );

  const hasResults = computed(() => results.value.length > 0);

  /**
   * Переключает книгу; последнюю выбранную снять нельзя.
   * @param source - сокращение книги
   */
  function toggleSource(source: string): void {
    selected.value = toggleRequired(selected.value, source);
  }
</script>

<template>
  <ToolGenerator
    :title="WILD_MAGIC_TEXT.title"
    :is-pending="isPending"
    :has-results="hasResults"
    @generate="generate"
    @clear="clear"
  >
    <template #form>
      <ToolCountField v-model="count" />

      <UFormField
        v-if="sources.length"
        :label="WILD_MAGIC_TEXT.sources"
      >
        <div class="flex flex-wrap gap-2">
          <UTooltip
            v-for="source in sources"
            :key="source.shortName"
            :text="source.name"
          >
            <ToolChip
              :label="source.shortName"
              :is-selected="selected.includes(source.shortName)"
              @toggle="toggleSource(source.shortName)"
            />
          </UTooltip>
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
        <template #trailing>
          <UTooltip :text="result.value.source.name">
            <UBadge
              :label="result.value.source.shortName"
              color="neutral"
              variant="subtle"
              class="shrink-0"
            />
          </UTooltip>
        </template>
      </ToolResultCard>
    </ToolResultGrid>
  </ToolGenerator>
</template>
