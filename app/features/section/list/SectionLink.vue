<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  import type { EntrySource } from '../model';

  import { NuxtLink } from '#components';

  import { SectionSourceBadge } from '../source-badge';

  /**
   * Запись в списке раздела: русское и английское название, метка группы
   * источника и короткие сведения (урон, цена) справа от английского.
   * Без адреса строка просто показывает запись, как у драгоценностей.
   */
  const {
    to = undefined,
    title,
    subtitle = undefined,
    source = undefined,
  } = defineProps<{
    to?: RouteLocationRaw;
    title: string;
    subtitle?: string;
    source?: EntrySource | null;
  }>();

  defineSlots<{
    leading?: () => unknown;
    trailing?: () => unknown;
    /** Короткие сведения о записи во второй строке. */
    details?: () => unknown;
  }>();

  const tag = computed(() => (to ? NuxtLink : 'div'));

  const linkAttributes = computed(() =>
    to ? { 'to': to, 'active-class': 'bg-elevated border-accented' } : {},
  );

  const rowClass = computed(() =>
    to ? 'transition-colors hover:bg-elevated' : undefined,
  );
</script>

<template>
  <component
    :is="tag"
    v-bind="linkAttributes"
    :class="rowClass"
    class="flex items-center gap-3 rounded-md border border-default px-3 py-2"
  >
    <slot name="leading" />

    <div class="min-w-0 flex-auto">
      <div class="flex items-center gap-2">
        <span class="min-w-0 flex-auto truncate text-highlighted">
          {{ title }}
        </span>

        <SectionSourceBadge
          v-if="source?.group"
          :group="source.group"
        />
      </div>

      <div
        v-if="subtitle || $slots.details"
        class="flex items-center gap-3 text-sm text-muted"
      >
        <span class="min-w-0 flex-auto truncate">{{ subtitle }}</span>

        <slot name="details" />
      </div>
    </div>

    <slot name="trailing" />
  </component>
</template>
