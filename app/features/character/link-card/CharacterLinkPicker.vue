<script setup lang="ts">
  import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui';

  import type { EntrySource } from '~section/model';

  import type { TypedLink } from '../model';

  import { SectionSourceBadge } from '~section/source-badge';

  import { groupByBookType } from '../model';

  interface LinkItem extends CommandPaletteItem {
    source?: EntrySource | null;
  }

  /**
   * Кнопка выбора подкласса или разновидности, как на new.ttg.club: число
   * вариантов, подпись и выбранный вариант; по клику — поиск по вариантам,
   * разбитым по типу книги.
   */
  const { label, placeholder, emptyText, links, activePath } = defineProps<{
    /** Подпись над кнопкой: «Подкласс:», «Разновидность:». */
    label: string;
    /** Подсказка в поиске по вариантам. */
    placeholder: string;
    /** Текст кнопки, пока вариант не выбран. */
    emptyText: string;
    links: Array<TypedLink>;
    /** Адрес открытой записи: выбранный вариант подсвечивается. */
    activePath: string;
  }>();

  const emit = defineEmits<{
    select: [url: string];
  }>();

  const isOpen = ref(false);

  const search = ref('');

  const active = computed(() => links.find((link) => link.url === activePath));

  const groups = computed<Array<CommandPaletteGroup<LinkItem>>>(() =>
    groupByBookType(links).map((group) => ({
      id: group.name,
      label: group.name,
      items: group.items.map((link) => ({
        label: link.name.rus,
        suffix: link.name.eng ? `[${link.name.eng}]` : undefined,
        source: link.source,
        active: link.url === activePath,
        onSelect: () => select(link.url),
      })),
    })),
  );

  /**
   * Закрывает список и отдаёт выбранный вариант.
   * @param url - адрес варианта
   */
  function select(url: string): void {
    isOpen.value = false;
    emit('select', url);
  }
</script>

<template>
  <UPopover
    v-model:open="isOpen"
    :ui="{ content: 'p-0' }"
    arrow
  >
    <UButton
      :active="!!active || isOpen"
      active-variant="subtle"
      variant="soft"
      color="primary"
      class="gap-2"
    >
      <UBadge
        :label="links.length"
        variant="subtle"
        color="primary"
        size="lg"
      />

      <span class="flex flex-col items-start leading-tight">
        <span class="text-xs text-muted">{{ label }}</span>

        <span class="text-left">{{ active?.name.rus ?? emptyText }}</span>
      </span>
    </UButton>

    <template #content>
      <UCommandPalette
        v-model:search-term="search"
        :groups="groups"
        :placeholder="placeholder"
        :autofocus="false"
        :ui="{
          input: '[&>input]:h-8 [&>input]:text-sm',
          content: 'max-h-80',
        }"
        class="w-80 max-w-[calc(100vw-2rem)]"
      >
        <template #item-trailing="{ item }">
          <SectionSourceBadge
            v-if="item.source?.group"
            :group="item.source.group"
            :label="item.source.shortName"
            :tooltip="item.source.name"
          />
        </template>
      </UCommandPalette>
    </template>
  </UPopover>
</template>
