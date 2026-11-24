<script setup lang="ts">
  import type { MechanicsBlock, MechanicsForm, MechanicsKind } from '../model';

  import {
    getMechanicsFilledCount,
    MECHANICS_BLOCK,
    MECHANICS_KIND_BLOCKS,
    MECHANICS_TEXT,
  } from '../model';
  import MechanicsAbilityBonuses from './MechanicsAbilityBonuses.vue';
  import MechanicsChoices from './MechanicsChoices.vue';
  import MechanicsCounters from './MechanicsCounters.vue';
  import MechanicsEntityRefs from './MechanicsEntityRefs.vue';
  import MechanicsModifiers from './MechanicsModifiers.vue';
  import MechanicsProficiencies from './MechanicsProficiencies.vue';
  import MechanicsSection from './MechanicsSection.vue';
  import MechanicsSpellList from './MechanicsSpellList.vue';
  import MechanicsSpells from './MechanicsSpells.vue';

  /**
   * Механика записи для листа персонажа — перенос редактора даров нового
   * сайта под модели старого бэкенда: владения, выборы с вариантами и
   * ступенями, повышения характеристик, модификаторы, ресурсы, заклинания и
   * расширение списка заклинаний. Набор блоков задаёт вид записи: у класса
   * нет повышений характеристик, у расы — выдаваемых заклинаний.
   */
  const { kind, nested = false } = defineProps<{
    kind: MechanicsKind;
    /**
     * Механика лежит внутри записи (умения класса, особенности расы): без
     * своей карточки, блоками на дорожке раздела-хозяина.
     */
    nested?: boolean;
  }>();

  const mechanics = defineModel<MechanicsForm>({ required: true });

  /**
   * Блоки одни на оба вида — своей карточкой и внутри записи. Через
   * переиспользуемый шаблон, а не копией: разойдясь, копии перестали бы
   * править механику одинаково.
   */
  const [DefineBlocks, ReuseBlocks] = createReusableTemplate();

  /** Блоки модели этого вида. */
  const blocks = computed<ReadonlySet<MechanicsBlock>>(
    () => new Set(MECHANICS_KIND_BLOCKS[kind]),
  );

  const filledCount = computed(() =>
    getMechanicsFilledCount(mechanics.value, kind),
  );
</script>

<template>
  <DefineBlocks>
    <MechanicsAbilityBonuses
      v-if="blocks.has(MECHANICS_BLOCK.abilityBonuses)"
      v-model="mechanics.abilityBonuses"
    />

    <MechanicsProficiencies
      v-if="blocks.has(MECHANICS_BLOCK.proficiencies)"
      v-model="mechanics.proficiencies"
    />

    <MechanicsChoices
      v-if="blocks.has(MECHANICS_BLOCK.choices)"
      v-model="mechanics.choices"
    />

    <MechanicsModifiers
      v-if="blocks.has(MECHANICS_BLOCK.modifiers)"
      v-model="mechanics.modifiers"
    />

    <MechanicsCounters
      v-if="blocks.has(MECHANICS_BLOCK.counters)"
      v-model="mechanics.counters"
    />

    <MechanicsSpells
      v-if="blocks.has(MECHANICS_BLOCK.spells)"
      v-model="mechanics.spells"
    />

    <MechanicsSpellList
      v-if="blocks.has(MECHANICS_BLOCK.spellList)"
      v-model="mechanics.spellList"
    />

    <MechanicsSection
      v-if="blocks.has(MECHANICS_BLOCK.feats)"
      :title="MECHANICS_TEXT.feats"
      :count="mechanics.feats.length"
    >
      <MechanicsEntityRefs
        v-model="mechanics.feats"
        :label="MECHANICS_TEXT.feats"
      />
    </MechanicsSection>
  </DefineBlocks>

  <div
    v-if="nested"
    class="col-span-full flex flex-col gap-3"
  >
    <ReuseBlocks />
  </div>

  <UCard
    v-else
    variant="subtle"
    class="col-span-full"
    :ui="{ root: 'overflow-visible', body: 'flex flex-col gap-3' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <div class="flex min-w-0 flex-1 flex-col">
          <h2 class="truncate text-base text-highlighted">
            {{ MECHANICS_TEXT.title }}
          </h2>

          <span class="text-xs text-muted">{{ MECHANICS_TEXT.subtitle }}</span>
        </div>

        <UBadge
          v-if="filledCount"
          :label="String(filledCount)"
          color="primary"
          variant="subtle"
          class="shrink-0 tabular-nums"
        />
      </div>
    </template>

    <ReuseBlocks />
  </UCard>
</template>
