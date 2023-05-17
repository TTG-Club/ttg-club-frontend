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
              :formula="getAbilityFormula(creature.ability.str)"
              label="Проверка Силы"
            >
              {{ creature.ability.str }} ({{ getAbilityModifier(creature.ability.str) }})
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
              :formula="getAbilityFormula(creature.ability.dex)"
              label="Проверка Ловкости"
            >
              {{ creature.ability.dex }} ({{ getAbilityModifier(creature.ability.dex) }})
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
              :formula="getAbilityFormula(creature.ability.con)"
              label="Проверка Телосложения"
            >
              {{ creature.ability.con }} ({{ getAbilityModifier(creature.ability.con) }})
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
              :formula="getAbilityFormula(creature.ability.int)"
              label="Проверка Интеллекта"
            >
              {{ creature.ability.int }} ({{ getAbilityModifier(creature.ability.int) }})
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
              :formula="getAbilityFormula(creature.ability.wiz)"
              label="Проверка Мудрости"
            >
              {{ creature.ability.wiz }} ({{ getAbilityModifier(creature.ability.wiz) }})
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
              :formula="getAbilityFormula(creature.ability.cha)"
              label="Проверка Харизмы"
            >
              {{ creature.ability.cha }} ({{ getAbilityModifier(creature.ability.cha) }})
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

          <span>{{ getIterableStr(creature.damageVulnerabilities) }}</span>
        </p>

        <p v-if="creature.damageResistances">
          <strong>Сопротивление к урону </strong>

          <span>{{ getIterableStr(creature.damageResistances) }}</span>
        </p>

        <p v-if="creature.damageImmunities">
          <strong>Иммунитет к урону </strong>

          <span>{{ getIterableStr(creature.damageImmunities) }}</span>
        </p>

        <p v-if="creature.conditionImmunities">
          <strong>Иммунитет к состояниям </strong>

          <span>{{ getIterableStr(creature.conditionImmunities) }}</span>
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

<script>
  import RawContent from '@/components/content/RawContent.vue';
  import DetailTopBar from '@/components/UI/DetailTopBar.vue';
  import DiceRoller from '@/components/UI/DiceRoller.vue';
  import { useAbilityTransforms } from '@/common/composition/useAbilityTransforms';
  import UiEasyLightbox from '@/components/UI/kit/UiEasyLightbox.vue';

  export default {
    name: 'CreatureBody',
    components: {
      UiEasyLightbox,
      DetailTopBar,
      RawContent,
      DiceRoller
    },
    props: {
      creature: {
        type: Object,
        default: undefined,
        required: true
      },
      inTooltip: {
        type: Boolean,
        default: false
      }
    },
    setup() {
      const {
        getFormattedModifier: getAbilityModifier,
        getFormula: getAbilityFormula
      } = useAbilityTransforms();

      return {
        getAbilityModifier,
        getAbilityFormula
      };
    },
    computed: {
      topBarLeftString() {
        // eslint-disable-next-line max-len
        return `${
          this.creature.size.rus
        } ${
          this.creature.type.name
        }${
          this.creature.type.tags?.length ? ` (${ this.creature.type.tags.join(', ') })` : ''
        }, ${
          this.creature.alignment
        } / ${
          this.creature.size.eng
        } ${
          this.creature.size.cell
        }`;
      },

      speed() {
        if (!this.creature.speed?.length) {
          return '';
        }

        const speeds = [];

        for (const speed of this.creature.speed) {
          speeds.push(`${
            speed.name ? `${ speed.name } ` : ''
          }${
            speed.value ? `${ speed.value } фт.` : ''
          }${
            speed.additional ? ` (${ speed.additional })` : ''
          }`);
        }

        return speeds.join(', ');
      },

      savingThrows() {
        if (!this.creature.savingThrows?.length) {
          return [];
        }

        const saves = [];

        for (const save of this.creature.savingThrows) {
          const sign = Math.sign(save.value) > -1 ? '+' : '-';

          saves.push({
            formula: `к20${ sign }${ Math.abs(save.value) }`,
            label: save.shortName,
            name: save.name,
            value: `${ sign }${ Math.abs(save.value) }${ save.additional ? save.additional : '' }`
          });
        }

        return saves;
      },

      skills() {
        if (!this.creature.skills?.length) {
          return [];
        }

        const skills = [];

        for (const skill of this.creature.skills) {
          const sign = Math.sign(skill.value) > -1 ? '+' : '-';

          skills.push({
            formula: `к20${ sign }${ Math.abs(skill.value) }`,
            label: skill.name,
            value: `${ sign }${ Math.abs(skill.value) }${ skill.additional ? skill.additional : '' }`
          });
        }

        return skills;
      },

      senses() {
        const senses = [];

        if (this.creature.senses?.senses?.length) {
          for (const sense of this.creature.senses.senses) {
            const index = senses.push(`${ sense.name } ${ sense.value } фт.`);

            if (sense.additional) {
              senses[index - 1] += ` (${ sense.additional })`;
            }
          }
        }

        if (this.creature.senses?.passivePerception) {
          senses.push(`пассивная Внимательность ${ this.creature.senses.passivePerception }`);
        }

        return senses.join(', ');
      },
      challengeRating() {
        if (this.creature.challengeRating === '—') {
          return this.creature.challengeRating;
        }

        if (this.creature.experience === 0) {
          return `${ this.creature.challengeRating } (0 или 10 опыта)`;
        }

        return `${ this.creature.challengeRating } (${ this.creature.experience.toLocaleString() } опыта)`;
      },
      hitDiceFormula() {
        const sign = Math.sign(this.creature.hits.bonus) > -1 ? '+' : '-';
        const bonus = Math.abs(this.creature.hits.bonus);

        return this.creature.hits.bonus
          ? `${ this.creature.hits.formula } ${ sign } ${ bonus }`
          : this.creature.hits.formula;
      }
    },
    methods: {
      getIterableStr(strings) {
        let str = '';

        for (let i = 0; i < strings.length; i++) {
          if (!i) {
            str += strings[i];

            continue;
          }

          str += strings[i].indexOf(',') > -1 ? '; ' : ', ';
          str += strings[i];
        }

        return str;
      }
    }
  };
</script>
