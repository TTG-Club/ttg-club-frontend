<script setup lang="ts">
  import type { Group, RenderNode, RenderResult } from '../types';

  import { consola } from 'consola';
  import { computed } from 'vue';

  import {
    GROUP_SPACING,
    GROUP_SPACING_AFTER_SEPARATOR,
    GROUP_SPACING_BEFORE_SEPARATOR,
    GROUP_SPACING_SEPARATOR,
    SEPARATOR_BLOCK_TYPE,
  } from '../consts';
  import { render, toBlockGroups } from '../renderer';

  const { renderNode } = defineProps<{
    renderNode: RenderNode | RenderNode[];
  }>();

  /**
   * Вертикальная отбивка группы от соседей.
   *
   * Вокруг разделителя весь зазор задаёт он сам (паддингом), а margin'ы гасятся:
   * описание рисуется во флекс-колонке (ArticleBody и другие тела), где соседние
   * margin'ы НЕ схлопываются, и `mt-*` заголовка после линии делал зазор снизу
   * заметно шире, чем сверху.
   *
   * @param blockType - Тип блочного маркера самой группы
   * @param previousType - Тип блочного маркера предыдущей группы
   * @param nextType - Тип блочного маркера следующей группы
   * @returns Строка Tailwind-классов отбивки
   */
  function toSpacingClass(
    blockType: string | undefined,
    previousType: string | undefined,
    nextType: string | undefined,
  ): string {
    if (blockType === SEPARATOR_BLOCK_TYPE) {
      return GROUP_SPACING_SEPARATOR;
    }

    if (previousType === SEPARATOR_BLOCK_TYPE) {
      return GROUP_SPACING_AFTER_SEPARATOR;
    }

    if (nextType === SEPARATOR_BLOCK_TYPE) {
      return GROUP_SPACING_BEFORE_SEPARATOR;
    }

    return GROUP_SPACING;
  }

  const rendered = computed<RenderResult>(() => {
    try {
      // Одиночный элемент (строка «{@...}»-разметки, MarkerNode или SimpleTextNode).
      if (!Array.isArray(renderNode)) {
        return {
          isSingle: true,
          vnodes: render(renderNode),
        };
      }

      // Каждый элемент описания разбиваем на блочные/инлайновые группы, чтобы
      // блочные маркеры ({@h}/{@list}/{@quote}/…) рисовались вне <p>, а не внутри.
      const blockGroups = renderNode.flatMap((entry) => toBlockGroups(entry));

      const groups: Group[] = blockGroups.map((group, index) => ({
        id: index,
        ...group,
        spacingClass: toSpacingClass(
          group.blockType,
          blockGroups[index - 1]?.blockType,
          blockGroups[index + 1]?.blockType,
        ),
      }));

      return {
        isSingle: false,
        groups,
      };
    } catch (e) {
      consola.error('[Markup] Error rendering entries:', e);

      return { isSingle: true, vnodes: [] };
    }
  });
</script>

<template>
  <ClientOnly>
    <template v-if="rendered.isSingle">
      <component
        :is="vnode"
        v-for="(vnode, index) in rendered.vnodes"
        :key="index"
      />
    </template>

    <template v-else>
      <template
        v-for="group in rendered.groups"
        :key="group.id"
      >
        <template v-if="group.isBlock">
          <component
            :is="vnode"
            v-for="(vnode, index) in group.vnodes"
            :key="index"
            :class="group.spacingClass"
          />
        </template>

        <p
          v-else
          :class="group.spacingClass"
        >
          <component
            :is="vnode"
            v-for="(vnode, index) in group.vnodes"
            :key="index"
          />
        </p>
      </template>
    </template>
  </ClientOnly>
</template>
