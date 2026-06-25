<script setup lang="ts">
  import RawContent from '@/shared/ui/RawContent.vue';

  type FeatureLevel = {
    name: string;
  };

  type TraitLink = {
    name: string;
    anchor: string;
    tooltipUrl: string;
    archetypeFeature: boolean;
  };

  type LevelRow = {
    level: number;
    proficiencyBonus: number;
    traits: TraitLink[];
    classFeatureValues: string[];
    archetypeFeatureValues: string[];
    spellSlots: string[];
  };

  type TraitFeature = {
    id: string;
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
    archetypeFeature: boolean;
    source?: {
      name?: string;
      shortName?: string;
    };
  };

  type ClassTraits = {
    diceHp: number;
    armor?: string;
    weapon?: string;
    tools?: string;
    savingThrows?: string;
    skillAvailableCount: number;
    availableSkills: string[];
    equipment?: string;
    classFeatureLevels: FeatureLevel[];
    archetypeFeatureLevels: FeatureLevel[];
    levels: LevelRow[];
    features: TraitFeature[];
  };

  const props = defineProps<{
    traits?: ClassTraits;
  }>();

  const emit = defineEmits<{
    (e: 'loaded'): void;
    (e: 'before-unmount'): void;
    (e: 'anchor-click', hash: string): void;
  }>();

  const spellSlotHeaders = computed(() => {
    const maxSlots = Math.max(
      0,
      ...(props.traits?.levels || []).map((level) => level.spellSlots.length),
    );

    return Array.from({ length: maxSlots }, (_, index) => index + 1);
  });

  const hasEquipment = computed(() => !!props.traits?.equipment?.trim());

  onMounted(() => {
    emit('loaded');
  });

  onBeforeUnmount(() => {
    emit('before-unmount');
  });

  const anchorClickHandler = (hash: string) => {
    emit('anchor-click', hash);
  };
</script>

<template>
  <div
    v-if="traits"
    class="class-traits"
  >
    <details
      open
      class="feet_show mt-0"
    >
      <summary class="h4 feet_show">
        <span>Хиты</span>
      </summary>

      <div class="content">
        <p class="class_stats">
          <b>Кость Хитов:</b>

          <dice-roller :formula="`1к${traits.diceHp}`" />
          за каждый уровень
        </p>

        <p class="class_stats">
          <b>Хиты на 1 уровне:</b>

          {{ traits.diceHp }} + ваш модификатор <strong>Телосложения</strong>
        </p>

        <p class="class_stats">
          <b>Хиты на следующих уровнях:</b>

          <dice-roller :formula="`1к${traits.diceHp}`" />
          (или {{ Math.floor(traits.diceHp / 2) + 1 }}) + модификатор
          <strong>Телосложения</strong> за каждый уровень этого класса, после
          первого (минимум 1)
        </p>
      </div>
    </details>

    <div class="table-responsive class">
      <table class="dnd5_table">
        <thead>
          <tr align="center">
            <th
              rowspan="2"
              class="class-traits__level-column"
            >
              Ур.
            </th>

            <th
              rowspan="2"
              class="class-traits__level-column"
            >
              БМ
            </th>

            <th
              rowspan="2"
              class="align_left"
            >
              Умения
            </th>

            <th
              v-for="feature in traits.classFeatureLevels"
              :key="`class-${feature.name}`"
              rowspan="2"
              class="class-traits__feature-column"
            >
              {{ feature.name }}
            </th>

            <th
              v-for="feature in traits.archetypeFeatureLevels"
              :key="`archetype-${feature.name}`"
              rowspan="2"
              class="class-traits__feature-column"
            >
              {{ feature.name }}
            </th>

            <th
              v-if="spellSlotHeaders.length"
              :colspan="spellSlotHeaders.length"
              class="bb"
            >
              Ячейки заклинаний на уровень заклинаний
            </th>
          </tr>

          <tr
            v-if="spellSlotHeaders.length"
            align="center"
          >
            <th
              v-for="slot in spellSlotHeaders"
              :key="slot"
              class="mini_lvl"
            >
              {{ slot }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="level in traits.levels"
            :key="level.level"
            align="center"
          >
            <td>{{ level.level }}</td>

            <td>+{{ level.proficiencyBonus }}</td>

            <td class="align_left">
              <template
                v-for="(trait, index) in level.traits"
                :key="`${level.level}-${trait.anchor}`"
              >
                <detail-tooltip :url="trait.tooltipUrl">
                  <a
                    :class="{
                      tip_scroll: true,
                      archetype_feet: trait.archetypeFeature,
                    }"
                    :href="trait.anchor"
                    @click.left.exact.prevent="anchorClickHandler(trait.anchor)"
                  >
                    {{ trait.name }}
                  </a>
                </detail-tooltip>

                <span v-if="index < level.traits.length - 1">, </span>
              </template>
            </td>

            <td
              v-for="(value, index) in level.classFeatureValues"
              :key="`class-${level.level}-${index}`"
            >
              {{ value }}
            </td>

            <td
              v-for="(value, index) in level.archetypeFeatureValues"
              :key="`archetype-${level.level}-${index}`"
            >
              {{ value }}
            </td>

            <td
              v-for="(slot, index) in level.spellSlots"
              :key="`slot-${level.level}-${index}`"
            >
              {{ slot }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <details open>
      <summary class="h4">
        <span>Владение</span>
      </summary>

      <div class="content">
        <p class="class_stats">
          <b>Доспехи:</b>

          <raw-content
            v-if="traits.armor"
            :template="traits.armor"
            tag="span"
          />
        </p>

        <p class="class_stats">
          <b>Оружие:</b>

          <raw-content
            v-if="traits.weapon"
            :template="traits.weapon"
            tag="span"
          />
        </p>

        <p class="class_stats">
          <b>Инструменты:</b>

          <raw-content
            v-if="traits.tools"
            :template="traits.tools"
            tag="span"
          />
        </p>

        <p class="class_stats"><b>Спасброски:</b> {{ traits.savingThrows }}</p>

        <p class="class_stats">
          <b>Навыки:</b>

          <span v-if="traits.skillAvailableCount === 18">
            Выберите любые навыки.
          </span>

          <span v-else>
            Выберите {{ traits.skillAvailableCount }} навыка из следующих:
            {{ traits.availableSkills.join(', ') }}
          </span>
        </p>
      </div>
    </details>

    <details
      v-if="hasEquipment"
      open
    >
      <summary class="h4">
        <span>Снаряжение</span>
      </summary>

      <div class="content">
        <p>
          Вы начинаете со следующим снаряжением в дополнение к снаряжению,
          полученному за вашу предысторию:
        </p>

        <raw-content :template="traits.equipment" />
      </div>
    </details>

    <details
      v-for="feature in traits.features"
      :key="feature.id"
      open
    >
      <summary
        :id="feature.id"
        :class="{
          h4: true,
          archetype_feet: feature.archetypeFeature,
        }"
      >
        <span>{{ feature.name }}</span>

        <span
          v-if="feature.source?.shortName"
          class="source-data tip"
          :title="feature.source.name"
        >
          {{ feature.source.shortName }}
        </span>
      </summary>

      <div class="content">
        <div class="caption_text">
          <span>{{ feature.type }}</span>

          <a
            v-if="feature.optional"
            href="/rules/optional_class_features"
            class="tip optional-rules"
            title="Эта опция представлена в книге «Котёл Таши со всякой всячиной». Всё в этой книге опционально."
          >
            (опционально)
          </a>
        </div>

        <raw-content
          v-if="feature.description"
          :template="feature.description"
        />
      </div>
    </details>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .class-traits {
    padding: 0 16px;

    @include media-min($xl) {
      padding: 0 24px;
    }

    &__level-column {
      width: 24px;
    }

    &__feature-column {
      width: 5%;
    }
  }
</style>
