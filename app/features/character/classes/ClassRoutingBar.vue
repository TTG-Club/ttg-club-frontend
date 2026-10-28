<script setup lang="ts">
  import type { ClassDetail } from '../model';

  import { useSectionOpener } from '~section/composables';

  import { CharacterLinkPicker } from '../link-card';
  import {
    CLASS_ICON,
    CLASS_TEXT,
    findClassArchetype,
    getClassOptionsLink,
    getClassOptionTabs,
    getClassSpellsFilterUrl,
    getClassSpellsLink,
    getParentClassName,
  } from '../model';
  import ClassFilterLink from './ClassFilterLink.vue';

  /**
   * Переходы со страницы класса, как на new.ttg.club: к самому классу,
   * к его подклассам, к его заклинаниям и особенностям (воззваниям,
   * манёврам…) в их разделах.
   * Класс и подкласс открываются так, как велит режим раздела.
   */
  const { entry, path } = defineProps<{
    entry: ClassDetail;
    /** Адрес открытой записи: класса или архетипа. */
    path: string;
  }>();

  defineSlots<{
    /** Кнопки страницы класса после переходов, например описание. */
    default?: () => unknown;
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

  const optionTabs = computed(() => getClassOptionTabs(entry));
</script>

<template>
  <!--
    В узком контейнере все кнопки идут ровной сеткой по две, а кнопка слота
    при чётном числе переходов занимает всю строку. В широком переходы идут
    строкой с переносом, а кнопка слота стоит справа от них.
  -->
  <div
    class="grid grid-cols-2 gap-2 @min-2xl:flex @min-2xl:items-start [&:has(>div>:nth-child(even):last-child)>:last-child]:col-span-2"
  >
    <div
      class="contents @min-2xl:flex @min-2xl:min-w-0 @min-2xl:flex-1 @min-2xl:flex-wrap @min-2xl:gap-2"
    >
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

      <ClassFilterLink
        v-if="spellsFilterUrl"
        :filter-url="spellsFilterUrl"
        :get-link="getClassSpellsLink"
        :icon="CLASS_ICON.spells"
        :label="CLASS_TEXT.listLabel"
        :text="CLASS_TEXT.spellsList"
      />

      <ClassFilterLink
        v-for="tab in optionTabs"
        :key="tab.key"
        :filter-url="tab.filterUrl"
        :get-link="getClassOptionsLink"
        :icon="CLASS_ICON.options"
        :label="CLASS_TEXT.listLabel"
        :text="tab.name"
      />
    </div>

    <slot />
  </div>
</template>
