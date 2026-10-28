<script setup lang="ts">
  import type { ClassLink } from '../model';

  import { CharacterRowCard } from '../link-card';
  import { CLASS_TEXT, getClassIcon } from '../model';

  /**
   * Карточка класса в виде «Модерн»: значок, кость хитов, книга и архетипы,
   * раскрывающиеся прямо в карточке.
   */
  const { classLink, to = undefined } = defineProps<{
    classLink: ClassLink;
    to?: string;
  }>();

  const icon = computed(() => getClassIcon(classLink.icon));

  const tags = computed(() => (classLink.dice ? [classLink.dice] : []));

  const archetypesLabel = computed(
    () => classLink.archetypeName ?? CLASS_TEXT.archetypes,
  );
</script>

<template>
  <CharacterRowCard
    :name="classLink.name"
    :url="classLink.url"
    :source="classLink.source"
    :image="classLink.image"
    :icon="icon"
    :tags="tags"
    :to="to"
    :links="classLink.archetypes"
    :links-label="archetypesLabel"
  />
</template>
