<script setup lang="ts">
  import type { CreatureDetail } from '../model';

  import { DetailTooltip } from '~content/detail-tooltip';
  import { ContentLink, ContentRender } from '~content/render';
  import { DiceRoller } from '~dice-roller/roller';
  import { SectionImagePreview } from '~section/image-preview';
  import { SectionSourceBar } from '~section/source-bar';

  import {
    CREATURE_TEXT,
    getAbilityScores,
    getArmorClassLabel,
    getChallengeRatingLabel,
    getCreatureActionGroups,
    getCreatureActions,
    getCreatureTypeLabel,
    getHitsFormula,
    getLanguagesLabel,
    getSavingThrowRolls,
    getSensesLabel,
    getSkillRolls,
    getSpeedLabel,
    joinCreatureList,
    LIST_SEPARATOR,
  } from '../model';
  import CreatureAbilities from './CreatureAbilities.vue';
  import CreatureActions from './CreatureActions.vue';
  import CreatureProperty from './CreatureProperty.vue';
  import CreatureRolls from './CreatureRolls.vue';

  /**
   * Блок характеристик существа: тип и размер в плашке, КД, хиты и
   * скорость, характеристики с бросками, защиты и чувства, затем умения,
   * действия, логово, места обитания, описание и теги.
   */
  const { creature } = defineProps<{
    creature: CreatureDetail;
  }>();

  const typeLabel = computed(() => getCreatureTypeLabel(creature));

  const armorClass = computed(() => getArmorClassLabel(creature));

  const armors = computed(() => creature.armors ?? []);

  const hitsFormula = computed(() => getHitsFormula(creature.hits));

  const speed = computed(() => getSpeedLabel(creature.speed));

  const scores = computed(() => getAbilityScores(creature));

  const savingThrows = computed(() =>
    getSavingThrowRolls(creature.savingThrows),
  );

  const skills = computed(() => getSkillRolls(creature.skills));

  const defenses = computed(() =>
    [
      {
        key: 'vulnerabilities',
        label: CREATURE_TEXT.damageVulnerabilities,
        items: creature.damageVulnerabilities,
      },
      {
        key: 'resistances',
        label: CREATURE_TEXT.damageResistances,
        items: creature.damageResistances,
      },
      {
        key: 'immunities',
        label: CREATURE_TEXT.damageImmunities,
        items: creature.damageImmunities,
      },
      {
        key: 'conditions',
        label: CREATURE_TEXT.conditionImmunities,
        items: creature.conditionImmunities,
      },
    ].flatMap(({ items, ...rest }) =>
      items?.length ? [{ ...rest, value: joinCreatureList(items) }] : [],
    ),
  );

  const senses = computed(() => getSensesLabel(creature));

  const languages = computed(() => getLanguagesLabel(creature));

  const challengeRating = computed(() => getChallengeRatingLabel(creature));

  const feats = computed(() => getCreatureActions(creature.feats));

  const actionGroups = computed(() => getCreatureActionGroups(creature));

  const environment = computed(() =>
    creature.environment?.join(LIST_SEPARATOR),
  );
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar :left="typeLabel" />

    <div class="flow-root">
      <SectionImagePreview
        v-if="creature.images?.length"
        :images="creature.images"
        :alt="creature.name.rus"
      />

      <div class="flex flex-col gap-1">
        <CreatureProperty :label="CREATURE_TEXT.armorClass">
          {{ armorClass }}

          <span v-if="armors.length"
            >(<span
              v-for="(armor, index) in armors"
              :key="armor.name"
              ><DetailTooltip
                v-if="armor.url"
                type="armor"
                :url="armor.url"
                :title="armor.name"
                ><ContentLink
                  class="text-link hover:text-link-hover"
                  :href="armor.url"
                  :attributes="{}"
                  >{{ armor.name }}</ContentLink
                ></DetailTooltip
              >

              <template v-else>{{ armor.name }}</template>

              <template v-if="index < armors.length - 1">{{
                LIST_SEPARATOR
              }}</template></span
            >)</span
          >
        </CreatureProperty>

        <CreatureProperty :label="CREATURE_TEXT.hits">
          {{ creature.hits.average }}

          <span v-if="hitsFormula"
            >(<DiceRoller
              :formula="hitsFormula"
              :label="CREATURE_TEXT.hitsRoll"
              :source="creature.name.rus"
              >{{ hitsFormula }}</DiceRoller
            >)</span
          >

          <span
            v-if="creature.hits.text"
            class="ml-1"
            >{{ creature.hits.text }}</span
          >
        </CreatureProperty>

        <CreatureProperty :label="CREATURE_TEXT.speed">
          {{ speed }}
        </CreatureProperty>
      </div>

      <!-- Характеристики обтекают картинку, как в старом SPA -->
      <CreatureAbilities
        :scores="scores"
        :source="creature.name.rus"
        class="mt-4"
      />
    </div>

    <div class="flex flex-col gap-1">
      <CreatureRolls
        v-if="savingThrows.length"
        :label="CREATURE_TEXT.savingThrows"
        :rolls="savingThrows"
        :source="creature.name.rus"
      />

      <CreatureRolls
        v-if="skills.length"
        :label="CREATURE_TEXT.skills"
        :rolls="skills"
        :source="creature.name.rus"
      />

      <CreatureProperty
        v-for="defense in defenses"
        :key="defense.key"
        :label="defense.label"
      >
        {{ defense.value }}
      </CreatureProperty>

      <CreatureProperty
        v-if="senses"
        :label="CREATURE_TEXT.senses"
      >
        {{ senses }}
      </CreatureProperty>

      <CreatureProperty :label="CREATURE_TEXT.languages">
        {{ languages }}
      </CreatureProperty>

      <CreatureProperty :label="CREATURE_TEXT.challengeRating">
        {{ challengeRating }}
      </CreatureProperty>

      <CreatureProperty
        v-if="creature.proficiencyBonus"
        :label="CREATURE_TEXT.proficiencyBonus"
      >
        {{ creature.proficiencyBonus }}
      </CreatureProperty>
    </div>

    <div class="content-render">
      <template v-if="feats.length">
        <hr class="mb-4 border-default" />

        <CreatureActions :items="feats" />
      </template>

      <template
        v-for="group in actionGroups"
        :key="group.key"
      >
        <h4 class="header_separator">
          <span>{{ group.title }}</span>
        </h4>

        <ContentRender
          v-if="group.intro"
          :html="group.intro"
        />

        <p v-else-if="group.text">
          {{ group.text }}
        </p>

        <CreatureActions :items="group.items" />
      </template>

      <template v-if="environment">
        <h4 class="header_separator">
          <span>{{ CREATURE_TEXT.environment }}</span>
        </h4>

        <p>{{ environment }}</p>
      </template>

      <details v-if="creature.description">
        <summary class="h4">
          <span>{{ CREATURE_TEXT.description }}</span>
        </summary>

        <div class="content">
          <ContentRender :html="creature.description" />
        </div>
      </details>

      <details
        v-for="tag in creature.tags"
        :key="tag.name"
      >
        <summary class="h4">
          <span>{{ tag.name }}</span>
        </summary>

        <div class="content">
          <ContentRender
            v-if="tag.description"
            :html="tag.description"
          />
        </div>
      </details>
    </div>
  </div>
</template>
