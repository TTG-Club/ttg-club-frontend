<script setup lang="ts">
  import type { ClassDetail, ClassTraits } from '../model';

  import { ContentRender } from '~content/render';

  import {
    CLASS_TEXT,
    getClassSkillsLabel,
    OPTIONAL_FEATURES_PATH,
    sortClassFeatures,
  } from '../model';
  import ArchetypeSpells from './ArchetypeSpells.vue';
  import ClassArchetypes from './ClassArchetypes.vue';
  import ClassLevelTable from './ClassLevelTable.vue';

  /**
   * Умения класса: таблица уровней, владения, снаряжение, умения
   * по уровням и архетипы класса.
   */
  const { entry, traits } = defineProps<{
    entry: ClassDetail;
    traits: ClassTraits;
  }>();

  const route = useRoute();
  const container = useTemplateRef('container');

  const skills = computed(() => getClassSkillsLabel(traits));

  const features = computed(() => sortClassFeatures(traits));

  // Таблица заклинаний архетипа идёт сразу после его описания
  const archetypeSpellTable = computed(() =>
    entry.archetypeSpellTable?.levels.length
      ? entry.archetypeSpellTable
      : undefined,
  );

  // Архетипы перечисляются только на странице самого класса
  const archetypes = computed(() =>
    traits.archetype ? [] : (entry.archetypes ?? []),
  );

  /**
   * Класс заголовка умения: умения архетипа выделены, как раньше.
   * @param isArchetype - умение архетипа
   */
  function getFeatureClass(isArchetype?: boolean | null) {
    return isArchetype ? 'h4 archetype_feet' : 'h4';
  }

  /**
   * Нужна ли таблица заклинаний архетипа после умения.
   * @param id - идентификатор умения
   */
  function hasSpellTableAfter(id: string) {
    return !!archetypeSpellTable.value && id === traits.archetype?.id;
  }

  /**
   * Прокручивает к умению по якорю из таблицы уровней.
   * @param anchor - якорь вида `#c12`
   */
  function scrollToFeature(anchor: string) {
    const id = anchor.replace(/^#/, '');

    container.value
      ?.querySelector(`[id="${id}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Ссылка на умение из адреса, как в старом SPA
  onMounted(() => {
    if (route.hash) {
      scrollToFeature(route.hash);
    }
  });
</script>

<template>
  <div
    ref="container"
    :class="$style.traits"
    class="content-render"
  >
    <ClassLevelTable
      :traits="traits"
      @select="scrollToFeature"
    />

    <details open>
      <summary class="h4">
        <span>{{ CLASS_TEXT.proficiencies }}</span>
      </summary>

      <div class="content">
        <p class="class_stats">
          <b class="mr-1">{{ CLASS_TEXT.armor }}</b>

          <ContentRender
            v-if="traits.armor"
            :html="traits.armor"
            tag="span"
          />
        </p>

        <p class="class_stats">
          <b class="mr-1">{{ CLASS_TEXT.weapon }}</b>

          <ContentRender
            v-if="traits.weapon"
            :html="traits.weapon"
            tag="span"
          />
        </p>

        <p class="class_stats">
          <b class="mr-1">{{ CLASS_TEXT.tools }}</b>

          <ContentRender
            v-if="traits.tools"
            :html="traits.tools"
            tag="span"
          />
        </p>

        <p class="class_stats">
          <b>{{ CLASS_TEXT.savingThrows }}</b>

          {{ traits.savingThrows }}
        </p>

        <p class="class_stats">
          <b>{{ CLASS_TEXT.skills }}</b>

          {{ skills }}
        </p>
      </div>
    </details>

    <details
      v-if="traits.equipment?.trim()"
      open
    >
      <summary class="h4">
        <span>{{ CLASS_TEXT.equipment }}</span>
      </summary>

      <div class="content">
        <p>{{ CLASS_TEXT.equipmentIntro }}</p>

        <ContentRender :html="traits.equipment" />
      </div>
    </details>

    <template
      v-for="feature in features"
      :key="feature.id"
    >
      <details open>
        <summary
          :id="feature.id"
          :class="getFeatureClass(feature.archetypeFeature)"
        >
          <span>{{ feature.name }}</span>

          <UTooltip
            v-if="feature.source?.shortName"
            :text="feature.source.name ?? feature.source.shortName"
          >
            <span class="source-data">{{ feature.source.shortName }}</span>
          </UTooltip>
        </summary>

        <div class="content">
          <div class="caption_text">
            <span>{{ feature.type }}</span>

            <UTooltip
              v-if="feature.optional"
              :text="CLASS_TEXT.optionalHint"
            >
              <NuxtLink
                :to="OPTIONAL_FEATURES_PATH"
                class="optional-rules ml-1"
              >
                {{ CLASS_TEXT.optional }}
              </NuxtLink>
            </UTooltip>
          </div>

          <ContentRender
            v-if="feature.description"
            :html="feature.description"
          />
        </div>
      </details>

      <ArchetypeSpells
        v-if="hasSpellTableAfter(feature.id) && archetypeSpellTable"
        :table="archetypeSpellTable"
      />
    </template>

    <ClassArchetypes
      v-if="archetypes.length"
      :archetypes="archetypes"
    />
  </div>
</template>

<style lang="scss" module>
  /* Первый блок сразу под обложкой, без отступа сверху */
  .traits:global(.content-render) > :first-child {
    margin-top: 0;
  }
</style>
