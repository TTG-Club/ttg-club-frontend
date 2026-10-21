<script setup lang="ts">
  import type { OptionDetail } from '../model';

  import { ContentLink, ContentRender } from '~content/render';
  import { SectionSourceBar } from '~section/source-bar';

  import { getRequirementsLabel, OPTION_TEXT } from '../model';

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
    <SectionSourceBar
      :left="requirements"
      :source="option.source"
    />

    <ContentRender
      v-if="option.description"
      :html="option.description"
    />

    <p
      v-if="option.classes?.length"
      class="flex flex-wrap gap-x-1"
    >
      <b>{{ OPTION_TEXT.classes }}</b>

      <span
        v-for="(item, index) in option.classes"
        :key="item.name"
      >
        <ContentLink
          v-if="item.url"
          :href="item.url"
          :attributes="{}"
          >{{ item.name }}</ContentLink
        >

        <template v-else>{{ item.name }}</template>

        <template v-if="index < option.classes.length - 1">{{
          OPTION_TEXT.classSeparator
        }}</template>
      </span>
    </p>
  </div>
</template>
