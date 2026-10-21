<script setup lang="ts">
  import type { ArchetypeSpellTable } from '../model';

  import {
    CLASS_TEXT,
    getArchetypeSpellLevelHeader,
    getArchetypeSpellSuffix,
  } from '../model';

  /** Таблица заклинаний архетипа: уровень и заклинания со ссылками. */
  const { table } = defineProps<{
    table: ArchetypeSpellTable;
  }>();

  const levelHeader = computed(() => getArchetypeSpellLevelHeader(table));

  const rows = computed(() =>
    table.levels.map((level) => ({
      level: level.level,
      spells: level.spells.map((spell, index) => ({
        url: spell.url,
        label: `${spell.name.toLowerCase()} [${spell.englishName.toLowerCase()}]`,
        suffix: getArchetypeSpellSuffix(
          spell,
          index === level.spells.length - 1,
        ),
      })),
    })),
  );
</script>

<template>
  <div class="table-responsive">
    <table>
      <thead>
        <tr>
          <th>{{ levelHeader }}</th>

          <th class="align_left">
            {{ CLASS_TEXT.spells }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in rows"
          :key="row.level"
        >
          <td class="text-center">
            {{ row.level }}
          </td>

          <td>
            <span
              v-for="spell in row.spells"
              :key="spell.url"
              class="mr-1"
              ><NuxtLink :to="spell.url">{{ spell.label }}</NuxtLink
              >{{ spell.suffix }}</span
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
