<script setup lang="ts">
  import type { RaceDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionImagePreview } from '~section/image-preview';
  import { SectionSourceBar } from '~section/source-bar';

  import { getRaceStats, RACE_TEXT, sortRaceSkills } from '../model';

  /**
   * Карточка расы: картинка, короткие характеристики, особенности
   * (часть раскрыта сразу), описание и разновидности под спойлерами.
   */
  const { race } = defineProps<{
    race: RaceDetail;
  }>();

  const stats = computed(() => getRaceStats(race));

  const skills = computed(() => sortRaceSkills(race));

  /**
   * Класс особенности: особенности разновидности выделены, как раньше.
   * @param isSubrace - особенность от разновидности
   */
  function getSkillClass(isSubrace?: boolean | null) {
    return isSubrace ? 'archetype_feet' : undefined;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar :source="race.source" />

    <div class="flow-root">
      <SectionImagePreview
        v-if="race.images?.length"
        :images="race.images"
        :alt="race.name.rus"
      />

      <dl class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="rounded-lg border border-default px-3 py-2"
        >
          <dt class="text-sm font-semibold text-highlighted">
            <UTooltip :text="stat.hint">
              <span class="cursor-help">{{ stat.label }}</span>
            </UTooltip>
          </dt>

          <dd>{{ stat.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="content-render">
      <details
        v-for="skill in skills"
        :key="skill.name"
        :class="getSkillClass(skill.subrace)"
        :open="Boolean(skill.opened)"
      >
        <summary class="h4">
          <span>{{ skill.name }}</span>
        </summary>

        <div class="content">
          <ContentRender
            v-if="skill.description"
            :html="skill.description"
          />
        </div>
      </details>

      <details v-if="race.description">
        <summary class="h4">
          <span>{{ RACE_TEXT.description }}</span>
        </summary>

        <div class="content">
          <ContentRender :html="race.description" />
        </div>
      </details>

      <template v-if="race.subraces?.length">
        <h4>{{ RACE_TEXT.subraces }}</h4>

        <details
          v-for="subrace in race.subraces"
          :key="subrace.name.eng"
          class="spoiler feet_show"
        >
          <summary class="h4">
            <span>{{ subrace.name.rus }}</span>

            <span
              v-if="subrace.source"
              class="source-data"
            >
              {{ subrace.source.shortName }}
            </span>
          </summary>

          <div class="content">
            <ContentRender
              v-if="subrace.description"
              :html="subrace.description"
            />

            <div
              v-for="feature in subrace.features?.length
                ? subrace.features
                : subrace.skills"
              :key="feature.name"
            >
              <h4 class="header_separator">
                <span>{{ feature.name }}</span>
              </h4>

              <ContentRender
                v-if="feature.description"
                :html="feature.description"
              />
            </div>
          </div>
        </details>
      </template>
    </div>
  </div>
</template>
