<script setup lang="ts">
  type ArchetypeSpell = {
    name: string;
    englishName: string;
    url: string;
    advanced?: string;
  };

  type ArchetypeSpellLevel = {
    level: number;
    spells: ArchetypeSpell[];
  };

  defineProps<{
    levels: ArchetypeSpellLevel[];
  }>();
</script>

<template>
  <div class="table-responsive">
    <table class="dnd5_table">
      <thead>
        <tr>
          <th>Уровень персонажа</th>

          <th>Заклинания</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="level in levels"
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
