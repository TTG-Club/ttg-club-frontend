<script setup lang="ts">
  import type { ClassDetail } from '../model';

  import { useSectionOpener } from '~section/composables';
  import { filterResponseSchema, normalizeFilter } from '~section/model';

  import { CharacterLinkPicker } from '../link-card';
  import {
    CLASS_ICON,
    CLASS_TEXT,
    findClassArchetype,
    getClassSpellsFilterUrl,
    getClassSpellsLink,
    getParentClassName,
  } from '../model';

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

  /**
   * Открывает класс или подкласс через страницу раздела, а вне раздела
   * переходит на его страницу.
   * @param url - адрес класса или подкласса
   */
  function openEntry(url: string): void {
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

    <CharacterLinkPicker
      v-if="archetypes.length"
      :label="CLASS_TEXT.subclassLabel"
      :placeholder="CLASS_TEXT.searchSubclass"
      :empty-text="CLASS_TEXT.chooseSubclass"
      :links="archetypes"
      :active-path="path"
      @select="openEntry"
    />

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
