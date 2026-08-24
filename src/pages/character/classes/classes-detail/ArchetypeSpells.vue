<script setup lang="ts">
  import type { ArchetypeSpellTable } from '@/shared/types/character/Classes';

  import { getArchetypeSpellLevelHeader } from '@/features/classes/model';

  const props = defineProps<{
    table: ArchetypeSpellTable;
  }>();

  const levelHeader = computed(() =>
    getArchetypeSpellLevelHeader(
      props.table.levelType,
      props.table.classNameGenitive,
    ),
  );
</script>

<template>
  <div class="table-responsive">
    <table class="dnd5_table">
      <thead>
        <tr>
          <th>{{ levelHeader }}</th>

          <th class="align_left">Заклинания</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="level in table.levels"
          :key="level.level"
        >
          <td class="archetype-spells__level">{{ level.level }}</td>

          <td>
            <template
              v-for="(spell, index) in level.spells"
              :key="spell.url"
            >
              <detail-tooltip
                :url="spell.url"
                type="spell"
              >
                <router-link
                  class="tip_spell"
                  :to="spell.url"
                >
                  {{ spell.name.toLowerCase() }} [{{
                    spell.englishName.toLowerCase()
                  }}]
                </router-link>
              </detail-tooltip>

              <span v-if="spell.advanced"> ({{ spell.advanced }})</span>

              <span v-if="index < level.spells.length - 1">, </span>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
  .archetype-spells__level {
    text-align: center;
  }
</style>
