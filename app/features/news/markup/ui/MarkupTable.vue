<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { normalizeTableCell, normalizeTableRows } from '../utils';

  /** Таблица из `{@table ...}`: на сайте она приходит готовым узлом из JSON. */
  type TableNode = MarkerNode & {
    caption?: RenderNode;
    colLabels?: Array<RenderNode>;
    colStyles?: Array<string>;
    colAligns?: Array<string>;
    rows?: unknown;
  };

  const { node, renderNodes } = defineProps<{
    node: TableNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const rows = computed(() => normalizeTableRows(node.rows));

  const colCount = computed(() =>
    node.colLabels?.length
      ? node.colLabels.length
      : Math.max(0, ...rows.value.map((row) => row.length)),
  );

  const columns = computed(() =>
    Array.from({ length: colCount.value }, (_, index) => ({
      index,
      label: renderNodes([node.colLabels?.[index] ?? `#${index + 1}`]),
      style: node.colStyles?.[index] ?? '',
      // Заголовки по умолчанию по центру — исторический вид таблиц
      align: node.colAligns?.[index]
        ? `text-${node.colAligns[index]}`
        : 'text-center',
    })),
  );

  const captionNodes = computed(() => {
    const captionSource = node.caption ?? node.content;

    if (!captionSource) {
      return [];
    }

    return renderNodes(
      Array.isArray(captionSource) ? captionSource : [captionSource],
    );
  });

  const bodyRows = computed(() =>
    rows.value.map((cells, rowIndex) => ({
      id: rowIndex,
      cells: columns.value.map((column) => {
        const cell = normalizeTableCell(cells[column.index]);

        return {
          id: column.index,
          style: column.style,
          align: cell.align ? `text-${cell.align}` : '',
          vnodes: renderNodes(cell.content),
        };
      }),
    })),
  );
</script>

<template>
  <div
    class="my-4! w-full overflow-x-auto rounded-lg border border-default bg-muted"
  >
    <table class="min-w-full border-collapse">
      <caption
        v-if="captionNodes.length"
        class="py-2 text-sm font-medium text-highlighted"
      >
        <component
          :is="vnode"
          v-for="(vnode, index) in captionNodes"
          :key="index"
        />
      </caption>

      <thead class="bg-elevated">
        <tr>
          <th
            v-for="column in columns"
            :key="column.index"
            :class="[
              'border-b border-default p-2 text-xs text-highlighted',
              column.align,
              column.style,
            ]"
          >
            <component
              :is="vnode"
              v-for="(vnode, index) in column.label"
              :key="index"
            />
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-default">
        <tr
          v-for="row in bodyRows"
          :key="row.id"
          class="divide-x divide-default"
        >
          <td
            v-for="cell in row.cells"
            :key="cell.id"
            :class="['px-2 py-1 text-xs text-default', cell.style, cell.align]"
          >
            <component
              :is="vnode"
              v-for="(vnode, index) in cell.vnodes"
              :key="index"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
