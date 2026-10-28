<script setup lang="ts">
  import type { RaceLink } from '../model';

  import { CharacterRowCard } from '../link-card';
  import { getRaceAbilitiesLabel, RACE_TEXT } from '../model';

  /**
   * Карточка вида в виде «Модерн»: бонусы к характеристикам, книга и
   * разновидности, раскрывающиеся прямо в карточке.
   */
  const { race, to = undefined } = defineProps<{
    race: RaceLink;
    to?: string;
  }>();

  const tags = computed(() => {
    const abilities = getRaceAbilitiesLabel(race.abilities, true);

    return abilities ? [abilities] : [];
  });
</script>

<template>
  <CharacterRowCard
    :name="race.name"
    :url="race.url"
    :source="race.source"
    :image="race.image"
    :tags="tags"
    :to="to"
    :links="race.subraces"
    :links-label="RACE_TEXT.subraces"
  />
</template>
