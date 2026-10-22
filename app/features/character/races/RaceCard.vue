<script setup lang="ts">
  import type { RaceLink } from '../model';

  import { CharacterLinkCard } from '../link-card';
  import { getRaceAbilitiesLabel, RACE_TEXT } from '../model';

  /**
   * Карточка расы в списке: бонусы характеристик, книга и разновидности.
   */
  const { race, to = undefined } = defineProps<{
    race: RaceLink;
    to?: string;
  }>();

  const abilities = computed(() => getRaceAbilitiesLabel(race.abilities, true));
</script>

<template>
  <CharacterLinkCard
    :name="race.name"
    :url="race.url"
    :image="race.image"
    :to="to"
    :links="race.subraces"
    :links-label="RACE_TEXT.subraces"
    :show-label="RACE_TEXT.showSubraces"
    :hide-label="RACE_TEXT.hideSubraces"
  >
    <template #badges>
      <UBadge
        v-if="abilities"
        :label="abilities"
        variant="solid"
        size="sm"
        class="rounded-full"
      />

      <UTooltip
        v-if="race.source"
        :text="race.source.name"
      >
        <UBadge
          :label="race.source.shortName"
          variant="solid"
          size="sm"
          class="rounded-full"
        />
      </UTooltip>
    </template>
  </CharacterLinkCard>
</template>
