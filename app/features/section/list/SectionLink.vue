<script setup lang="ts">
  import type { EntrySource } from '../model';

  import { NuxtLink } from '#components';

  import { useSectionOpener } from '../composables';
  import { SectionSourceBadge } from '../source-badge';

  /**
   * Запись в списке раздела, плиткой как на new.ttg.club: название с
   * английским в скобках, книга цветом группы источника и короткие сведения
   * (урон, цена) второй строкой. Клик открывает запись так, как велит режим
   * раздела; Ctrl-клик и средняя кнопка ведут на страницу записи. Без адреса
   * плитка просто показывает запись, как у драгоценностей.
   */
  const {
    to = undefined,
    title,
    subtitle = undefined,
    source = undefined,
  } = defineProps<{
    /** Адрес записи, например `/spells/fireball`. */
    to?: string;
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

  const opener = useSectionOpener();

  const tag = computed(() => (to ? NuxtLink : 'div'));

  const isActive = computed(() => !!to && opener?.activePath.value === to);

  const linkAttributes = computed(() => (to ? { to } : {}));

  const tileClass = computed(() => {
    if (isActive.value) {
      return 'border-primary bg-primary/10 ring-1 ring-primary/50';
    }

    return to
      ? 'border-default bg-elevated/50 transition-colors hover:border-accented hover:bg-elevated'
      : 'border-default bg-elevated/50';
  });

  /**
   * Открывает запись через страницу раздела, если она умеет.
   * @param event - клик по плитке
   */
  function open(event: MouseEvent): void {
    if (!to || !opener) {
      return;
    }

    event.preventDefault();
    opener.open(to);
  }
</script>

<template>
  <component
    :is="tag"
    v-bind="linkAttributes"
    :class="tileClass"
    class="flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2"
    @click.left.exact.capture="open"
  >
    <slot name="leading" />

    <div class="flex min-w-0 flex-auto flex-col gap-1">
      <div class="flex items-center gap-2">
        <span class="min-w-0 flex-auto truncate text-highlighted">
          {{ title }}

          <span
            v-if="subtitle"
            class="text-muted"
          >
            [{{ subtitle }}]
          </span>
        </span>

        <SectionSourceBadge
          v-if="source?.group"
          :group="source.group"
          :label="source.shortName"
          :tooltip="source.name"
        />
      </div>

      <div
        v-if="$slots.details"
        class="flex min-w-0 items-center gap-3 text-sm text-muted"
      >
        <slot name="details" />
      </div>
    </div>

    <slot name="trailing" />
  </component>
</template>
