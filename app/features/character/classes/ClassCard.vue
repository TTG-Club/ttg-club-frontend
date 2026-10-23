<script setup lang="ts">
  import type { ClassLink } from '../model';

  import { CharacterCoverCard } from '../link-card';
  import { CLASS_TEXT, getClassIcon } from '../model';

  /**
   * Карточка класса в списке: обложка, книга и архетипы в дровере.
   */
  const { classLink, to = undefined } = defineProps<{
    classLink: ClassLink;
    to?: string;
  }>();

  const icon = computed(() => getClassIcon(classLink.icon));

  const archetypesLabel = computed(
    () => classLink.archetypeName ?? CLASS_TEXT.archetypes,
  );
</script>

<template>
  <CharacterCoverCard
    :name="classLink.name"
    :url="classLink.url"
    :source="classLink.source"
    :image="classLink.image"
    :icon="icon"
    :to="to"
    :links="classLink.archetypes"
    :links-label="archetypesLabel"
  />
</template>
