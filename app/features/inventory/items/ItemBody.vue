<script setup lang="ts">
  import type { ItemDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionSourceBar } from '~section/source-bar';

  import { getItemCategoriesLabel, ITEM_TEXT } from '../model';

  /** Карточка снаряжения: категории, цена, вес и описание. */
  const { item } = defineProps<{
    item: ItemDetail;
  }>();

  const categories = computed(() => getItemCategoriesLabel(item));
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar
      :left="categories"
      :source="item.source"
    />

    <ul
      v-if="item.price || item.weight"
      class="flex flex-col gap-1.5"
    >
      <li v-if="item.price">
        <b>{{ ITEM_TEXT.price }}</b> {{ item.price }}
      </li>

      <li v-if="item.weight">
        <b>{{ ITEM_TEXT.weight }}</b> {{ item.weight }}
      </li>
    </ul>

    <ContentRender
      v-if="item.description"
      :html="item.description"
    />
  </div>
</template>
