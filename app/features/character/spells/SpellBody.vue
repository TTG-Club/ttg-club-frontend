<script setup lang="ts">
  import type { SpellDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionSourceBar } from '~section/source-bar';
  import { SectionStat, SectionStatGrid } from '~section/stat-grid';

  import {
    getSpellComponentLabels,
    getSpellTypeLabel,
    REFERENCE_SEPARATOR,
    SPELL_TEXT,
  } from '../model';
  import { ReferenceList } from '../references';

  /**
   * Карточка заклинания: круг и школа в плашке, время, дистанция,
   * длительность и компоненты, описание и кому заклинание доступно.
   */
  const { spell } = defineProps<{
    spell: SpellDetail;
  }>();

  const typeLabel = computed(() => getSpellTypeLabel(spell));

  const components = computed(() => getSpellComponentLabels(spell.components));

  const references = computed(() =>
    [
      { key: 'classes', label: SPELL_TEXT.classes, items: spell.classes },
      {
        key: 'subclasses',
        label: SPELL_TEXT.subclasses,
        items: spell.subclasses,
      },
      { key: 'races', label: SPELL_TEXT.races, items: spell.races },
      {
        key: 'backgrounds',
        label: SPELL_TEXT.backgrounds,
        items: spell.backgrounds,
      },
      { key: 'feats', label: SPELL_TEXT.feats, items: spell.feats },
    ].flatMap(({ items, ...rest }) =>
      items?.length ? [{ ...rest, items }] : [],
    ),
  );
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar :left="typeLabel" />

    <SectionStatGrid>
      <SectionStat :label="SPELL_TEXT.time">
        {{ spell.time }}
      </SectionStat>

      <SectionStat :label="SPELL_TEXT.range">
        {{ spell.range }}
      </SectionStat>

      <SectionStat :label="SPELL_TEXT.duration">
        {{ spell.duration }}
      </SectionStat>

      <SectionStat
        v-if="components.length"
        :label="SPELL_TEXT.components"
        class="sm:col-span-2 xl:col-span-3"
      >
        <span class="flex flex-wrap gap-x-1">
          <span
            v-for="(component, index) in components"
            :key="component.key"
          >
            <UTooltip
              :text="component.hint"
              :ui="{ content: 'h-auto max-w-sm', text: 'whitespace-normal' }"
            >
              <span class="cursor-help">{{ component.label }}</span>
            </UTooltip>

            <template v-if="index < components.length - 1">{{
              REFERENCE_SEPARATOR
            }}</template>
          </span>
        </span>
      </SectionStat>
    </SectionStatGrid>

    <ContentRender
      v-if="spell.description"
      :html="spell.description"
    />

    <p v-if="spell.upper">
      <b class="mr-1">{{ SPELL_TEXT.upper }}</b>

      <ContentRender
        :html="spell.upper"
        tag="span"
      />
    </p>

    <ReferenceList
      v-for="reference in references"
      :key="reference.key"
      :label="reference.label"
      :items="reference.items"
    />
  </div>
</template>
