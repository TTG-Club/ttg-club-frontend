<script setup lang="ts">
  import type { RaceDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionCollapse } from '~section/collapse';
  import { SectionDetailLayout } from '~section/detail-layout';
  import { SectionDrawer } from '~section/entry-drawer';
  import { SectionImageCover } from '~section/image-preview';

  import { getRaceStats, RACE_ICON, RACE_TEXT, sortRaceSkills } from '../model';
  import RaceRoutingBar from './RaceRoutingBar.vue';

  /**
   * Карточка расы, как вида на new.ttg.club: слева обложка и свойства,
   * справа переходы к основной расе и разновидностям, особенности и
   * разновидности. Описание открывается кнопкой в дровере, как у классов.
   */
  const { race, path } = defineProps<{
    race: RaceDetail;
    /** Адрес открытой записи: расы или разновидности. */
    path: string;
  }>();

  const stats = computed(() => getRaceStats(race));

  const skills = computed(() => sortRaceSkills(race));

  const hasAside = computed(
    () => !!race.images?.length || stats.value.length > 0,
  );

  const isDescriptionOpen = ref(false);

  /** Открывает описание расы в дровере. */
  function openDescription(): void {
    isDescriptionOpen.value = true;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionDetailLayout>
      <template
        v-if="race.baseRace || race.description"
        #header
      >
        <RaceRoutingBar
          :base-race="race.baseRace"
          :path="path"
        >
          <UButton
            v-if="race.description"
            :icon="RACE_ICON.description"
            variant="soft"
            color="neutral"
            @click.left.exact.prevent="openDescription"
          >
            <span class="flex flex-col items-start leading-tight">
              <span class="text-xs text-muted">{{ RACE_TEXT.aboutLabel }}</span>

              <span>{{ RACE_TEXT.description }}</span>
            </span>
          </UButton>
        </RaceRoutingBar>
      </template>

      <template
        v-if="hasAside"
        #aside
      >
        <div class="flex flex-col gap-4 @min-xl:@max-3xl:flex-row">
          <SectionImageCover
            v-if="race.images?.length"
            :images="race.images"
            :alt="race.name.rus"
          />

          <dl
            v-if="stats.length"
            class="w-full self-start overflow-hidden rounded-lg border border-default bg-muted py-1.5"
          >
            <div
              v-for="stat in stats"
              :key="stat.key"
              class="flex gap-2 px-4 py-1.5"
            >
              <dt
                class="min-w-28 flex-none text-sm font-medium text-highlighted"
              >
                {{ stat.label }}
              </dt>

              <dd>{{ stat.value }}</dd>
            </div>
          </dl>
        </div>
      </template>

      <div class="flex flex-col gap-6">
        <SectionCollapse
          v-for="skill in skills"
          :key="skill.name"
          :title="skill.name"
          default-open
        >
          <ContentRender
            v-if="skill.description"
            :html="skill.description"
          />
        </SectionCollapse>

        <section
          v-if="race.subraces?.length"
          class="flex flex-col gap-4"
        >
          <h3 class="text-xl font-semibold text-highlighted">
            {{ RACE_TEXT.subraces }}
          </h3>

          <SectionCollapse
            v-for="subrace in race.subraces"
            :key="subrace.name.eng"
            :title="subrace.name.rus"
          >
            <template
              v-if="subrace.source"
              #badge
            >
              <UTooltip :text="subrace.source.name">
                <UBadge
                  :label="subrace.source.shortName"
                  color="neutral"
                  variant="soft"
                  size="sm"
                />
              </UTooltip>
            </template>

            <div class="flex flex-col gap-4">
              <ContentRender
                v-if="subrace.description"
                :html="subrace.description"
              />

              <div
                v-for="feature in subrace.features?.length
                  ? subrace.features
                  : subrace.skills"
                :key="feature.name"
                class="flex flex-col gap-2"
              >
                <h4 class="text-lg font-semibold text-highlighted">
                  {{ feature.name }}
                </h4>

                <ContentRender
                  v-if="feature.description"
                  :html="feature.description"
                />
              </div>
            </div>
          </SectionCollapse>
        </section>
      </div>
    </SectionDetailLayout>

    <SectionDrawer
      v-model:open="isDescriptionOpen"
      :title="RACE_TEXT.description"
      :subtitle="race.name.rus"
    >
      <div class="content-render">
        <ContentRender
          v-if="race.description"
          :html="race.description"
        />
      </div>
    </SectionDrawer>
  </div>
</template>
