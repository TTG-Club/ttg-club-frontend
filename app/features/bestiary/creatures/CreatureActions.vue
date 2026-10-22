<script setup lang="ts">
  import type { CreatureAction } from '../model';

  import { ContentRender } from '~content/render';

  /**
   * Умения или действия существа: курсивное название с чертой слева,
   * за ним в той же строке описание, как в старом SPA.
   */
  const { items } = defineProps<{
    items: Array<CreatureAction>;
  }>();
</script>

<template>
  <div
    v-for="item in items"
    :key="item.key"
    :class="$style.action"
  >
    <h5 :class="$style.name">{{ item.name }}.</h5>

    <ContentRender :html="item.html" />
  </div>
</template>

<style module lang="scss">
  .action {
    display: flow-root;
  }

  /* Два класса перебивают отступы заголовков из типографики контента */
  .action .name {
    position: relative;
    float: left;
    margin-right: 4px;
    font-style: italic;

    &::before {
      content: '';

      position: absolute;
      top: 5px;
      left: -6px;

      display: block;

      width: 2px;
      height: 10px;

      background: var(--text-color-title);
    }
  }
</style>
