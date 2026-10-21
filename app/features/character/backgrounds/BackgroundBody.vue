<script setup lang="ts">
  import type { BackgroundDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { RollTable } from '~content/roll-table';
  import { SectionSourceBar } from '~section/source-bar';

  import {
    BACKGROUND_TEXT,
    CHARACTER_LIST_SEPARATOR,
    getBackgroundLanguages,
    hasPersonalization,
  } from '../model';

  /**
   * Карточка предыстории: владения, языки, снаряжение и капитал списком,
   * затем описание, умение предыстории и таблицы персонализации.
   */
  const { background } = defineProps<{
    background: BackgroundDetail;
  }>();

  const skills = computed(() =>
    background.skills?.join(CHARACTER_LIST_SEPARATOR),
  );

  const languages = computed(() => getBackgroundLanguages(background));

  const equipment = computed(() =>
    background.equipments?.join(CHARACTER_LIST_SEPARATOR),
  );

  const startGold = computed(() =>
    background.startGold == null
      ? undefined
      : `${background.startGold} ${BACKGROUND_TEXT.goldUnit}`,
  );

  const hasSkill = computed(() =>
    Boolean(background.skillName || background.skillDescription),
  );

  const skillTitle = computed(
    () => background.skillName || BACKGROUND_TEXT.skillFallback,
  );

  const isPersonalizationVisible = computed(() =>
    hasPersonalization(background),
  );
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar :source="background.source" />

    <ul class="flex flex-col gap-1.5">
      <li v-if="skills">
        <b>{{ BACKGROUND_TEXT.skills }}</b> {{ skills }}
      </li>

      <li v-if="background.toolOwnership">
        <b class="mr-1">{{ BACKGROUND_TEXT.tools }}</b>

        <ContentRender
          :html="background.toolOwnership"
          tag="span"
        />
      </li>

      <li v-if="languages">
        <b>{{ BACKGROUND_TEXT.languages }}</b> {{ languages }}
      </li>

      <li v-if="equipment">
        <b class="mr-1">{{ BACKGROUND_TEXT.equipment }}</b>

        <ContentRender
          :html="equipment"
          tag="span"
        />
      </li>

      <li v-if="startGold">
        <b>{{ BACKGROUND_TEXT.startGold }}</b> {{ startGold }}
      </li>
    </ul>

    <div class="content-render">
      <template v-if="background.description">
        <h4 class="header_separator">
          <span>{{ BACKGROUND_TEXT.description }}</span>
        </h4>

        <ContentRender :html="background.description" />
      </template>

      <template v-if="hasSkill">
        <h4 class="header_separator">
          <span>{{ skillTitle }}</span>
        </h4>

        <ContentRender
          v-if="background.skillDescription"
          :html="background.skillDescription"
        />
      </template>

      <template v-if="isPersonalizationVisible">
        <h4 class="header_separator">
          <span>{{ BACKGROUND_TEXT.personalization }}</span>
        </h4>

        <ContentRender
          v-if="background.personalization"
          :html="background.personalization"
        />

        <div
          v-for="table in background.personalizationTables"
          :key="table.name"
          class="overflow-x-auto"
        >
          <RollTable :table="table" />
        </div>
      </template>
    </div>
  </div>
</template>
