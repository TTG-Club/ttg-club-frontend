<script setup lang="ts">
  import type { FeatDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionSourceBar } from '~section/source-bar';

  import { getRequirementsLabel } from '../model';

  /** Карточка черты: требования в плашке источника и описание. */
  const { feat } = defineProps<{
    feat: FeatDetail;
  }>();

  const requirements = computed(() => getRequirementsLabel(feat.requirements));
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar
      :left="requirements"
      :source="feat.source"
    />

    <ContentRender
      v-if="feat.description"
      :html="feat.description"
    />
  </div>
</template>
