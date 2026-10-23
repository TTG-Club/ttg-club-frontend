<script setup lang="ts">
  import type { RaceLink } from '../model';

  import { CharacterCoverCard } from '../link-card';
  import { RACE_TEXT } from '../model';

  /**
   * Карточка расы в списке, как вида на new.ttg.club: обложка, книга и
   * разновидности в дровере.
   */
  const { race, to = undefined } = defineProps<{
    race: RaceLink;
    to?: string;
  }>();
</script>

<template>
  <CharacterCoverCard
    :name="race.name"
    :url="race.url"
    :source="race.source"
    :image="race.image"
    :to="to"
    :links="race.subraces"
    :links-label="RACE_TEXT.subraces"
  />
</template>
