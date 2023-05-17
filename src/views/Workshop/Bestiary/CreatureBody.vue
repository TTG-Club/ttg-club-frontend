<template>
  <div
    v-if="creature"
    :class="{ 'in-tooltip': inTooltip }"
    class="creature_wrapper creature-body bestiary"
  >
    <detail-top-bar
      :left="topBarLeftString"
      :source="creature.source"
    />

    <div class="content-padding">
      <ui-easy-lightbox :images="creature.images" />

      <div class="beast_info">
        <p>
          <strong>Класс доспеха </strong>

          <!-- eslint-disable-next-line max-len -->
          <span>{{
            `${ creature.armorClass }${ creature.armorText ? ` ${ creature.armorText }` : '' }`
          }}</span>

          <span v-if="creature.armors?.length">
            ({{ creature.armors.join(', ') }})
          </span>
        </p>

        <p>
          <strong>Хиты </strong>

          <span>{{ creature.hits.average }}&nbsp;</span>

          <span v-if="creature.hits?.formula">(<dice-roller
            :formula="hitDiceFormula"
            label="Хиты"
          >
            {{
              `${ creature.hits.formula }${
                creature.hits?.bonus
                  ? `${ creature.hits.sign }${ Math.abs(creature.hits.bonus) }`
                  : ''
              }`
            }}
          </dice-roller>)</span>

          <span v-if="creature.hits?.text">{{ creature.hits.text }}</span>
        </p>

        <p>
          <strong>Скорость </strong>

          <span v-if="speed">{{ speed }}</span>
        </p>
      </div>

      <div class="scores">
        <div class="scores__stats strength">
          <h4>
            <strong
              v-tippy="'Сила'"
            >СИЛ</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.str)"
              label="Проверка Силы"
            >
              {{ creature.ability.str }} ({{ getFormattedModifier(creature.ability.str) }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats dexterity">
          <h4>
            <strong
              v-tippy="'Ловкость'"
            >ЛОВ</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.dex)"
              label="Проверка Ловкости"
            >
              {{ creature.ability.dex }} ({{ getFormattedModifier(creature.ability.dex) }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats constitution">
          <h4>
            <strong
              v-tippy="'Телосложение'"
            >ТЕЛ</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.con)"
              label="Проверка Телосложения"
            >
              {{ creature.ability.con }} ({{ getFormattedModifier(creature.ability.con) }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats intelligence">
          <h4>
            <strong
              v-tippy="'Интеллект'"
            >ИНТ</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.int)"
              label="Проверка Интеллекта"
            >
              {{ creature.ability.int }} ({{ getFormattedModifier(creature.ability.int) }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats wisdom">
          <h4>
            <strong
              v-tippy="'Мудрость'"
            >МДР</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.wiz)"
              label="Проверка Мудрости"
            >
              {{ creature.ability.wiz }} ({{ getFormattedModifier(creature.ability.wiz) }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats charisma">
          <h4>
            <strong
              v-tippy="'Харизма'"
            >ХАР</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.cha)"
              label="Проверка Харизмы"
            >
              {{ creature.ability.cha }} ({{ getFormattedModifier(creature.ability.cha) }})
            </dice-roller>
          </p>
        </div>
      </div>

      <div class="beast_info">
        <p v-if="savingThrows.length">
          <strong>Спасброски </strong>

          <span
            v-for="(savingThrow, key) in savingThrows"
            :key="key"
          >
            <span>{{ savingThrow.label }}&nbsp;</span>

            <dice-roller
              :formula="savingThrow.formula"
              :label="`Спасбросок ${ savingThrow.name }`"
            >
              {{ savingThrow.value }}
            </dice-roller>

            <span v-if="key < savingThrows.length - 1">, </span>
          </span>
        </p>

        <p v-if="skills.length">
          <strong>Навыки </strong>

          <span
            v-for="(skill, key) in skills"
            :key="key"
          >
            <span>{{ skill.label }}&nbsp;</span>

            <dice-roller
              :formula="skill.formula"
              :label="`Проверка навыка ${ skill.label }`"
            >
              {{ skill.value }}
            </dice-roller>

            <span v-if="key < skills.length - 1">, </span>
          </span>
        </p>

        <p v-if="creature.damageVulnerabilities">
          <strong>Уязвимость к урону </strong>

          <span>{{ getIterableString(creature.damageVulnerabilities) }}</span>
        </p>

        <p v-if="creature.damageResistances">
          <strong>Сопротивление к урону </strong>

          <span>{{ getIterableString(creature.damageResistances) }}</span>
        </p>

        <p v-if="creature.damageImmunities">
          <strong>Иммунитет к урону </strong>

          <span>{{ getIterableString(creature.damageImmunities) }}</span>
        </p>

        <p v-if="creature.conditionImmunities">
          <strong>Иммунитет к состояниям </strong>

          <span>{{ getIterableString(creature.conditionImmunities) }}</span>
        </p>

        <p v-if="senses">
          <strong>Чувства </strong>

          <span>{{ senses }}</span>
        </p>

        <p>
          <strong>Языки </strong>

          <span> {{ creature.languages?.length ? creature.languages.join(', ') : '—' }}</span>
        </p>

        <p>
          <strong>Уровень опасности </strong>

          <span>{{ challengeRating }}</span>
        </p>

        <p>
          <strong>Бонус мастерства </strong>

          <span>{{ proficiencyBonus }}</span>
        </p>
      </div>

      <div v-if="creature.feats?.length">
        <h4 class="header_separator">
          <span>Способности</span>
        </h4>

        <div
          v-for="(feat, key) in creature.feats"
          :key="key"
        >
          <span class="bestiary_h5">
            <h5>{{ feat.name }}</h5>

            <raw-content :template="feat.value" />
          </span>
        </div>
      </div>

      <div v-if="creature.actions?.length">
        <h4 class="header_separator">
          <span>Действия</span>
        </h4>

        <div
          v-for="(action, key) in creature.actions"
          :key="key"
        >
          <span class="bestiary_h5">
            <h5>{{ action.name }}</h5>

            <raw-content :template="action.value" />
          </span>
        </div>
      </div>

      <div v-if="creature.bonusActions?.length">
        <h4 class="header_separator">
          <span>Бонусные действия</span>
        </h4>

        <div
          v-for="(bonus, key) in creature.bonusActions"
          :key="key"
        >
          <span class="bestiary_h5">
            <h5>{{ bonus.name }}</h5>

            <raw-content :template="bonus.value" />
          </span>
        </div>
      </div>

      <div v-if="creature.reactions?.length">
        <h4 class="header_separator">
          <span>Реакции</span>
        </h4>

        <div
          v-for="(reaction, key) in creature.reactions"
          :key="key"
        >
          <span class="bestiary_h5">
            <h5>{{ reaction.name }}</h5>

            <raw-content :template="reaction.value" />
          </span>
        </div>
      </div>

      <div v-if="creature.legendary?.list?.length">
        <h4 class="header_separator">
          <span>Легендарные Действия</span>
        </h4>

        <p v-if="!creature.legendary.description">
          <span>{{ creature.name.rus }}</span> может совершить 3 легендарных действия,
          выбирая из представленных ниже вариантов. За один раз можно использовать только одно легендарное
          <!-- eslint-disable-next-line max-len -->
          действие, и только в конце хода другого существа. <span>{{ creature.name.rus }}</span>
          восстанавливает
          использованные легендарные действия в начале своего хода.
        </p>

        <p v-else>
          <raw-content :template="creature.legendary.description" />
        </p>

        <div
          v-for="(action, key) in creature.legendary.list"
          :key="key"
        >
          <span class="bestiary_h5">
            <h5>{{ action.name }}</h5>

            <raw-content :template="action.value" />
          </span>
        </div>
      </div>

      <div v-if="creature.mysticalActions?.length">
        <h4 class="header_separator">
          <span>Мифические действия</span>
        </h4>

        <div
          v-for="(mystical, key) in creature.mysticalActions"
          :key="key"
        >
          <span class="bestiary_h5">
            <h5>{{ mystical.name }}</h5>

            <raw-content :template="mystical.value" />
          </span>
        </div>
      </div>

      <div v-if="creature.lair?.description">
        <h4 class="header_separator">
          <span>Логово</span>
        </h4>

        <raw-content :template="creature.lair.description" />
      </div>

      <div v-if="creature.lair?.action">
        <h4 class="header_separator">
          <span>Действия логова:</span>
        </h4>

        <raw-content :template="creature.lair.action" />
      </div>

      <div v-if="creature.lair?.effect">
        <h4 class="header_separator">
          <span>Региональные эффекты:</span>
        </h4>

        <raw-content :template="creature.lair.effect" />
      </div>

      <div v-if="creature.environment?.length">
        <h4 class="header_separator">
          <span>Места обитания</span>
        </h4>

        <p>
          <span>{{ creature.environment.join(', ') }}</span>
        </p>
      </div>

      <details v-if="creature.description">
        <summary class="h4 header_separator">
          <span>Описание</span>
        </summary>

        <raw-content
          :template="creature.description"
          class="content"
        />
      </details>

      <details
        v-for="(tag, key) in creature.tags"
        :key="key"
      >
        <summary class="h4 header_separator">
          <span>{{ tag.name }}</span>
        </summary>

        <raw-content
          :template="tag.description"
          class="content"
        />
      </details>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue';
  import toNumber from 'lodash/toNumber';
  import RawContent from '@/components/content/RawContent.vue';
  import DetailTopBar from '@/components/UI/DetailTopBar.vue';
  import DiceRoller from '@/components/UI/DiceRoller.vue';
  import UiEasyLightbox from '@/components/UI/kit/UiEasyLightbox.vue';
  import { getIterableString } from '@/common/helpers/string';
  import { getFormattedModifier, getFormula } from '@/common/helpers/abilityTransforms';

  const props = defineProps({
    creature: {
      type: Object,
      default: undefined,
      required: true
    },
    inTooltip: {
      type: Boolean,
      default: false
    }
  });

  const topBarLeftString = computed(() => `${
    props.creature.size.rus
  } ${
    props.creature.type.name
  }${
    props.creature.type.tags?.length ? ` (${ props.creature.type.tags.join(', ') })` : ''
  }, ${
    props.creature.alignment
  } / ${
    props.creature.size.eng
  } ${
    props.creature.size.cell
  }`);

  const speed = computed(() => {
    if (!(props.creature.speed instanceof Array)) {
      return '';
    }

    return props.creature.speed
      .map(item => `${
        item.name ? `${ item.name } ` : ''
      }${
        item.value ? `${ speed.value } фт.` : ''
      } фт.${
        item.additional ? ` (${ item.additional })` : ''
      }`)
      .join(', ');
  });

  const savingThrows = computed(() => {
    if (!(props.creature.savingThrows instanceof Array)) {
      return [];
    }

    return props.creature.savingThrows.map(save => ({
      formula: `к20${ getFormattedModifier(save.value) }`,
      label: save.shortName,
      name: save.name,
      value: `${ getFormattedModifier(save.value) }${ save.additional ? save.additional : '' }`
    }));
  });

  const skills = computed(() => {
    if (!(props.creature.skills instanceof Array)) {
      return [];
    }

    return props.creature.skills.map(skill => ({
      formula: `к20${ getFormattedModifier(skill.value) }`,
      label: skill.name,
      value: `${ getFormattedModifier(skill.value) }${ skill.additional ? skill.additional : '' }`
    }));
  });

  const senses = computed(() => {
    const list = [];

    if (props.creature.senses?.senses?.length) {
      for (const sense of props.creature.senses.senses) {
        const index = list.push(`${ sense.name } ${ sense.value } фт.`);

        if (sense.additional) {
          list[index - 1] += ` (${ sense.additional })`;
        }
      }
    }

    if (props.creature.senses?.passivePerception) {
      list.push(`пассивная Внимательность ${ props.creature.senses.passivePerception }`);
    }

    return list.join(', ');
  });

  const challengeRating = computed(() => {
    if (props.creature.challengeRating === '—') {
      return props.creature.challengeRating;
    }

    if (props.creature.experience === 0) {
      return `${ props.creature.challengeRating } (0 или 10 опыта)`;
    }

    return `${ props.creature.challengeRating } (${ props.creature.experience.toLocaleString() } опыта)`;
  });

  /**
   * // CR 0-4   → БМ=2
   * // CR 5-8   → БМ=3
   * // CR 9-12  → БМ=4
   * // CR 13-16 → БМ=5
   * // CR 17-20 → БМ=6
   * // CR 21-24 → БМ=7
   * // CR 25-28 → БМ=8
   * // CR 29-30 → БМ=9
   */
  const proficiencyBonus = computed(() => {
    const cr = toNumber(props.creature.challengeRating);

    if (Number.isNaN(cr) || !cr || cr <= 4) {
      return '+2';
    }

    if (cr <= 8) {
      return '+3';
    }

    if (cr <= 12) {
      return '+4';
    }

    if (cr <= 16) {
      return '+5';
    }

    if (cr <= 20) {
      return '+6';
    }

    if (cr <= 24) {
      return '+7';
    }

    if (cr <= 28) {
      return '+8';
    }

    return '+9';
  });

  const hitDiceFormula = computed(() => (props.creature.hits.bonus
    ? `${ props.creature.hits.formula } ${ getFormattedModifier(props.creature.hits.bonus) }`
    : props.creature.hits.formula));
</script>
