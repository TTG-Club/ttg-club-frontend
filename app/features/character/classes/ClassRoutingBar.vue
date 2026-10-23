<script setup lang="ts">
  import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui';

  import type { EntrySource } from '~section/model';

  import type { ClassDetail } from '../model';

  import { useSectionOpener } from '~section/composables';
  import { filterResponseSchema, normalizeFilter } from '~section/model';
  import { SectionSourceBadge } from '~section/source-badge';

  import {
    CLASS_ICON,
    CLASS_TEXT,
    findClassArchetype,
    getClassSpellsFilterUrl,
    getClassSpellsLink,
    getParentClassName,
    groupByBookType,
  } from '../model';

  interface SubclassItem extends CommandPaletteItem {
    source?: EntrySource | null;
  }

  /**
   * Переходы со страницы класса, как на new.ttg.club: к самому классу,
   * к его подклассам и к списку его заклинаний в разделе заклинаний.
   * Класс и подкласс открываются так, как велит режим раздела.
   */
  const { entry, path } = defineProps<{
    entry: ClassDetail;
    /** Адрес открытой записи: класса или архетипа. */
    path: string;
  }>();

  const router = useRouter();
  const opener = useSectionOpener();

  const archetype = computed(() => findClassArchetype(entry, path));

  const className = computed(() => getParentClassName(entry, archetype.value));

  const archetypes = computed(() => entry.archetypes ?? []);

  const subclassName = computed(
    () => archetype.value?.name.rus ?? CLASS_TEXT.chooseSubclass,
  );

  const isPopoverOpen = ref(false);

  const search = ref('');

  /**
   * Открывает класс или подкласс через страницу раздела, а вне раздела
   * переходит на его страницу.
   * @param url - адрес класса или подкласса
   */
  function openEntry(url: string): void {
    isPopoverOpen.value = false;

    if (opener) {
      opener.open(url);

      return;
    }

    router.push(url);
  }

  /**
   * Возврат к классу из подкласса без ухода со страницы раздела.
   * @param event - клик по ссылке
   */
  function openClass(event: MouseEvent): void {
    if (!opener) {
      return;
    }

    event.preventDefault();
    opener.open(entry.url);
  }

  const groups = computed<Array<CommandPaletteGroup<SubclassItem>>>(() =>
    groupByBookType(archetypes.value).map((group) => ({
      id: group.name,
      label: group.name,
      items: group.items.map((link) => ({
        label: link.name.rus,
        suffix: link.name.eng ? `[${link.name.eng}]` : undefined,
        source: link.source,
        active: link.url === path,
        onSelect: () => openEntry(link.url),
      })),
    })),
  );

  const spellsFilterUrl = computed(() => getClassSpellsFilterUrl(entry));

  // Класс в фильтре заклинаний задаётся его номером, а его знает только
  // фильтр класса, поэтому ссылка собирается из него.
  const { data: spellsLink } = useLazyAsyncData(
    () => `class-spells-link-${spellsFilterUrl.value ?? entry.url}`,
    async () => {
      const url = spellsFilterUrl.value;

      if (!url) {
        return null;
      }

      const filter = normalizeFilter(
        filterResponseSchema.parse(await $fetch(url, { method: 'POST' })),
      );

      return getClassSpellsLink(filter) ?? null;
    },
    { deep: false },
  );
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UButton
      :to="entry.url"
      :active="!archetype"
      active-variant="subtle"
      variant="soft"
      color="neutral"
      @click.left.exact.capture="openClass"
    >
      <span class="flex flex-col items-start leading-tight">
        <span class="text-xs text-muted">{{ CLASS_TEXT.classLabel }}</span>

        <span>{{ className }}</span>
      </span>
    </UButton>

    <UPopover
      v-if="archetypes.length"
      v-model:open="isPopoverOpen"
      :ui="{ content: 'p-0' }"
      arrow
    >
      <UButton
        :active="!!archetype || isPopoverOpen"
        active-variant="subtle"
        variant="soft"
        color="primary"
        class="gap-2"
      >
        <UBadge
          :label="archetypes.length"
          variant="subtle"
          color="primary"
          size="lg"
        />

        <span class="flex flex-col items-start leading-tight">
          <span class="text-xs text-muted">{{ CLASS_TEXT.subclassLabel }}</span>

          <span class="text-left">{{ subclassName }}</span>
        </span>
      </UButton>

      <template #content>
        <UCommandPalette
          v-model:search-term="search"
          :groups="groups"
          :placeholder="CLASS_TEXT.searchSubclass"
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

    <UButton
      v-if="spellsLink"
      :to="spellsLink"
      :icon="CLASS_ICON.spells"
      target="_blank"
      variant="soft"
      color="neutral"
    >
      <span class="flex flex-col items-start leading-tight">
        <span class="text-xs text-muted">{{ CLASS_TEXT.listLabel }}</span>

        <span>{{ CLASS_TEXT.spellsList }}</span>
      </span>
    </UButton>
  </div>
</template>
