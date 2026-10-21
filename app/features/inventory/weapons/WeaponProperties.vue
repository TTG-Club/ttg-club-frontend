<script setup lang="ts">
  import type { WeaponProperty } from '../model';

  import { ContentLink } from '~content/render';

  import { WEAPON_TEXT } from '../model';

  /**
   * Свойства оружия через запятую. Свойство ведёт на своё описание в
   * ширме, а само описание показывается в подсказке.
   */
  const { properties } = defineProps<{
    properties: Array<WeaponProperty>;
  }>();
</script>

<template>
  <span>
    <template
      v-for="(property, index) in properties"
      :key="property.name"
    >
      <UTooltip
        :text="property.description ?? undefined"
        :disabled="!property.description"
      >
        <ContentLink
          v-if="property.url"
          class="text-link hover:text-link-hover"
          :href="property.url"
          :attributes="{}"
        >
          {{ property.name }}
        </ContentLink>

        <span v-else>{{ property.name }}</span>
      </UTooltip>

      <UTooltip
        v-if="property.twoHandDice"
        :text="WEAPON_TEXT.twoHanded"
      >
        <span> ({{ property.twoHandDice }})</span>
      </UTooltip>

      <span v-if="property.distance">
        ({{ WEAPON_TEXT.distance }} {{ property.distance }})
      </span>

      <span v-if="index < properties.length - 1">, </span>
    </template>
  </span>
</template>
