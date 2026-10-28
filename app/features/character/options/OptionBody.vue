<script setup lang="ts">
  import type { OptionDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionSourceBar } from '~section/source-bar';

  import { getRequirementsLabel, OPTION_TEXT } from '../model';
  import { ReferenceList } from '../references';

  /**
   * Карточка особенности класса: требования в плашке источника, описание
   * и классы, которым она доступна.
   */
  const { option } = defineProps<{
    option: OptionDetail;
  }>();

  const requirements = computed(() =>
    getRequirementsLabel(option.requirements),
  );
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar :left="requirements" />

    <ContentRender
      v-if="option.description"
      :html="option.description"
    />

    <ReferenceList
      v-if="option.classes?.length"
      :label="OPTION_TEXT.classes"
      :items="option.classes"
    />
  </div>
</template>
