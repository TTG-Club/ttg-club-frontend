<script setup lang="ts">
  import type { SearchResult } from '../model';

  import { SectionSourceBadge } from '~section/source-badge';

  /**
   * Найденная запись на странице поиска: название с английским, источник,
   * раздел и начало описания, как в старом SPA.
   */
  const { result } = defineProps<{
    result: SearchResult;
  }>();
</script>

<template>
  <NuxtLink
    :to="result.url"
    class="flex flex-col gap-1 rounded-md border border-default px-3 py-2 transition-colors hover:bg-elevated"
  >
    <div class="flex items-center gap-2">
      <span class="min-w-0 flex-auto truncate text-highlighted">
        {{ result.name }}

        <span
          v-if="result.englishName"
          class="text-muted"
          >[{{ result.englishName }}]</span
        >
      </span>

      <SectionSourceBadge
        v-if="result.source?.group"
        :group="result.source.group"
      />
    </div>

    <div class="flex items-center gap-2 text-sm text-muted">
      <UTooltip
        v-if="result.source"
        :text="result.source.name"
      >
        <span>({{ result.source.shortName }})</span>
      </UTooltip>

      <span class="min-w-0 truncate">{{ result.section }}</span>
    </div>

    <p
      v-if="result.description"
      class="line-clamp-2 text-sm text-toned"
    >
      {{ result.description }}
    </p>
  </NuxtLink>
</template>
