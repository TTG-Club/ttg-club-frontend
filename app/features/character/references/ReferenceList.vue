<script setup lang="ts">
  import type { ReferenceClass } from '../model';

  import { ContentLink } from '~content/render';

  import { REFERENCE_SEPARATOR } from '../model';

  /**
   * Строка ссылок на классы, подклассы, расы или предыстории, которым
   * доступна запись. У подкласса в подсказке — название его класса.
   */
  const { label, items } = defineProps<{
    label: string;
    items: Array<ReferenceClass>;
  }>();
</script>

<template>
  <p class="flex flex-wrap gap-x-1">
    <b>{{ label }}</b>

    <span
      v-for="(item, index) in items"
      :key="item.url || item.name"
    >
      <UTooltip
        :text="item.class ?? undefined"
        :disabled="!item.class"
      >
        <ContentLink
          v-if="item.url"
          class="text-link hover:text-link-hover"
          :href="item.url"
          :attributes="{}"
          >{{ item.name }}</ContentLink
        >

        <span v-else>{{ item.name }}</span>
      </UTooltip>

      <template v-if="index < items.length - 1">{{
        REFERENCE_SEPARATOR
      }}</template>
    </span>
  </p>
</template>
