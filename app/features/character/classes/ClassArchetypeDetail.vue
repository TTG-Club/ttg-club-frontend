<script setup lang="ts">
  import type { ClassDetail } from '../model';

  import { ContentRender } from '~content/render';

  import { getArchetypeFeatures } from '../model';
  import ArchetypeSpells from './ArchetypeSpells.vue';

  /** Раскрытый архетип в списке архетипов класса: описание и умения. */
  const { archetype } = defineProps<{
    archetype: ClassDetail;
  }>();

  const description = computed(
    () => archetype.traits?.archetype?.description ?? undefined,
  );

  const features = computed(() =>
    archetype.traits ? getArchetypeFeatures(archetype.traits) : [],
  );

  const spellTable = computed(() =>
    archetype.archetypeSpellTable?.levels.length
      ? archetype.archetypeSpellTable
      : undefined,
  );
</script>

<template>
  <ContentRender
    v-if="description"
    :html="description"
  />

  <ArchetypeSpells
    v-if="spellTable"
    :table="spellTable"
  />

  <div
    v-for="feature in features"
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

    <ContentRender
      v-if="feature.description"
      :html="feature.description"
    />
  </div>
</template>
