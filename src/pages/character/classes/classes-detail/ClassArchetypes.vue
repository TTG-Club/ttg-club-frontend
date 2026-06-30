<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import type { TSource } from '@/shared/types/BaseApiFields';
  import RawContent from '@/shared/ui/RawContent.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  type ArchetypeLink = {
    name: {
      rus: string;
    };
    source: TSource;
    url: string;
  };

  type ArchetypeFeature = {
    id: number | string;
    name: string;
    description?: string;
    type?: string;
    archetypeFeature: boolean;
  };

  type ArchetypeDetail = ArchetypeLink & {
    traits?: {
      features?: ArchetypeFeature[];
    };
  };

  const props = defineProps<{
    archetypes: ArchetypeLink[];
    queryBooks: string[];
  }>();

  const details = reactive<Record<string, ArchetypeDetail | null>>({});
  const loading = reactive<Record<string, boolean>>({});

  const getArchetypeFeatures = (url: string) =>
    details[url]?.traits?.features?.filter(
      (feature) => feature.archetypeFeature,
    ) || [];

  const loadArchetype = async (archetype: ArchetypeLink) => {
    if (details[archetype.url] || loading[archetype.url]) {
      return;
    }

    try {
      loading[archetype.url] = true;

      const response = await httpClient.post<ArchetypeDetail>({
        url: archetype.url,
        payload: {
          filter: {
            book: props.queryBooks,
          },
        },
      });

      details[archetype.url] = response.data;
    } catch (error) {
      errorHandler(error);
    } finally {
      loading[archetype.url] = false;
    }
  };

  const toggleArchetype = (event: Event, archetype: ArchetypeLink) => {
    if (
      event.currentTarget instanceof HTMLDetailsElement &&
      event.currentTarget.open
    ) {
      loadArchetype(archetype);
    }
  };
</script>

<template>
  <section
    v-if="archetypes.length"
    class="class-archetypes"
  >
    <h4>Подклассы</h4>

    <details
      v-for="archetype in archetypes"
      :key="archetype.url"
      class="spoiler feet_show"
      @toggle="toggleArchetype($event, archetype)"
    >
      <summary class="h4">
        <span>{{ archetype.name.rus }}</span>

        <span
          class="source-data"
          :title="archetype.source.name"
        >
          {{ archetype.source.shortName }}
        </span>
      </summary>

      <div class="content">
        <n-spin v-if="loading[archetype.url]" />

        <template v-else>
          <div
            v-for="feature in getArchetypeFeatures(archetype.url)"
            :key="feature.id"
          >
            <h4 class="header_separator">
              <span>{{ feature.name }}</span>
            </h4>

            <div
              v-if="feature.type"
              class="caption_text"
            >
              {{ feature.type }}
            </div>

            <raw-content
              v-if="feature.description"
              :template="feature.description"
            />
          </div>
        </template>
      </div>
    </details>
  </section>
</template>

<style lang="scss" scoped>
  .class-archetypes {
    margin-top: 24px;
  }
</style>
