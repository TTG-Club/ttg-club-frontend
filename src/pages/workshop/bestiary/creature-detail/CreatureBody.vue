<script setup>
  import DetailTooltip from '@/shared/ui/DetailTooltip.vue';
  import DiceRoller from '@/shared/ui/DiceRoller.vue';
  import UiEasyLightbox from '@/shared/ui/kit/UiEasyLightbox.vue';
  import RawContent from '@/shared/ui/RawContent.vue';
  import {
    getFormattedModifier,
    getFormula,
  } from '@/shared/utils/abilityTransforms';
  import { getIterableString } from '@/shared/utils/string';

  import DetailTopBar from '@/features/DetailTopBar.vue';

  const props = defineProps({
    creature: {
      type: Object,
      default: undefined,
      required: true,
    },
    inTooltip: {
      type: Boolean,
      default: false,
    },
  });

  const speed = computed(() => {
    if (!(props.creature.speed instanceof Array)) {
      return '';
    }

    return props.creature.speed
      .map(
        (item) =>
          `${item.name ? `${item.name} ` : ''}${
            item.value || item.value === 0 ? `${item.value} фт.` : ''
          }${item.additional ? ` (${item.additional})` : ''}`,
      )
      .join(', ');
  });

  const savingThrows = computed(() => {
    if (!(props.creature.savingThrows instanceof Array)) {
      return [];
    }

    return props.creature.savingThrows.map((save) => ({
      formula: `к20+${save.value}`,
      label: save.shortName,
      name: save.name,
      value: `+${save.value}${save.additional ? save.additional : ''}`,
    }));
  });

  const skills = computed(() => {
    if (!(props.creature.skills instanceof Array)) {
      return [];
    }

    return props.creature.skills.map((skill) => ({
      formula: skill.value ? `к20+${skill.value}` : 'к20',
      label: skill.name,
      value: `+${skill.value}${skill.additional ? skill.additional : ''}`,
    }));
  });

  const senses = computed(() => {
    const list = [];

    if (props.creature.senses?.senses?.length) {
      for (const sense of props.creature.senses.senses) {
        const index = list.push(`${sense.name} ${sense.value} фт.`);

        if (sense.additional) {
          list[index - 1] += ` (${sense.additional})`;
        }
      }
    }

    if (props.creature.senses?.passivePerception) {
      list.push(
        `пассивная Внимательность ${props.creature.senses.passivePerception}`,
      );
    }

    return list.join(', ');
  });

  const challengeRating = computed(() => {
    if (props.creature.challengeRating === '—') {
      return props.creature.challengeRating;
    }

    if (props.creature.experience === 0) {
      return `${props.creature.challengeRating} (0 или 10 опыта)`;
    }

    return `${
      props.creature.challengeRating
    } (${props.creature.experience.toLocaleString()} опыта)`;
  });

  const hitDiceFormula = computed(() =>
    props.creature.hits.bonus
      ? `${props.creature.hits.formula} ${props.creature.hits.sign} ${Math.abs(
          props.creature.hits.bonus,
        )}`
      : props.creature.hits.formula,
  );
</script>

<template>
  <div
    v-if="creature"
    :class="{ 'in-tooltip': inTooltip }"
    class="creature_wrapper creature-body bestiary"
  >
    <detail-top-bar :source="creature.source">
      <template #left>
        <span>{{ creature.size.rus }} {{ creature.type.name }}</span>

        <span v-if="creature.type.tags?.length">
          ({{ creature.type.tags.join(', ') }})</span
        >

        <span
          >, {{ creature.alignment }} / {{ creature.size.eng }}
          {{ creature.size.cell }}</span
        >
      </template>
    </detail-top-bar>

    <div class="content-padding">
      <ui-easy-lightbox :images="creature.images" />

      <div class="beast_info">
        <p>
          <strong>Класс доспеха </strong>

          <!-- eslint-disable-next-line max-len -->
          <span>{{
            `${creature.armorClass}${
              creature.armorText ? ` ${creature.armorText}` : ''
            }`
          }}</span>

          <span v-if="creature.armors?.length">
            (<span
              v-for="(armor, key) in creature.armors"
              :key="key + armor.url"
            >
              <detail-tooltip
                v-if="armor.url?.length"
                type="armor"
                :url="armor.url"
              >
                <router-link :to="armor.url">{{ armor.name }}</router-link>
              </detail-tooltip>

              <span v-else>{{ armor.name }}</span>

              <span v-if="key < creature.armors?.length - 1">, </span> </span
            >)
          </span>
        </p>

        <p>
          <strong>Хиты </strong>

          <span>{{ creature.hits.average }}&nbsp;</span>

          <span v-if="creature.hits?.formula"
            >(<dice-roller
              :formula="hitDiceFormula"
              label="Хиты"
            >
              {{
                `${creature.hits.formula}${
                  creature.hits?.bonus
                    ? `${creature.hits.sign}${Math.abs(creature.hits.bonus)}`
                    : ''
                }`
              }} </dice-roller
            >)</span
          >

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
            <strong v-tippy="'Сила'">СИЛ</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.str)"
              label="Проверка Силы"
            >
              {{ creature.ability.str }} ({{
                getFormattedModifier(creature.ability.str)
              }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats dexterity">
          <h4>
            <strong v-tippy="'Ловкость'">ЛОВ</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.dex)"
              label="Проверка Ловкости"
            >
              {{ creature.ability.dex }} ({{
                getFormattedModifier(creature.ability.dex)
              }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats constitution">
          <h4>
            <strong v-tippy="'Телосложение'">ТЕЛ</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.con)"
              label="Проверка Телосложения"
            >
              {{ creature.ability.con }} ({{
                getFormattedModifier(creature.ability.con)
              }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats intelligence">
          <h4>
            <strong v-tippy="'Интеллект'">ИНТ</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.int)"
              label="Проверка Интеллекта"
            >
              {{ creature.ability.int }} ({{
                getFormattedModifier(creature.ability.int)
              }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats wisdom">
          <h4>
            <strong v-tippy="'Мудрость'">МДР</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.wiz)"
              label="Проверка Мудрости"
            >
              {{ creature.ability.wiz }} ({{
                getFormattedModifier(creature.ability.wiz)
              }})
            </dice-roller>
          </p>
        </div>

        <div class="scores__stats charisma">
          <h4>
            <strong v-tippy="'Харизма'">ХАР</strong>
          </h4>

          <p>
            <dice-roller
              :formula="getFormula(creature.ability.cha)"
              label="Проверка Харизмы"
            >
              {{ creature.ability.cha }} ({{
                getFormattedModifier(creature.ability.cha)
              }})
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
              :label="`Спасбросок ${savingThrow.name}`"
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
              :label="`Проверка навыка ${skill.label}`"
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

          <span>
            {{
              creature.languages?.length ? creature.languages.join(', ') : '—'
            }}</span
          >
        </p>

        <p>
          <strong>Уровень опасности </strong>

          <span>{{ challengeRating }}</span>
        </p>

        <p>
          <strong>Бонус мастерства </strong>

          <span>{{ creature.proficiencyBonus }}</span>
        </p>
      </div>

      <div v-if="creature.feats?.length">
        <hr />

        <div
          v-for="(feat, key) in creature.feats"
          :key="key"
        >
          <span class="bestiary_h5">
            <h5>{{ feat.name }}.</h5>

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
            <h5>{{ action.name }}.</h5>

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
            <h5>{{ bonus.name }}.</h5>

            <raw-content :template="bonus.value" />
          </span>
        </div>
      </div>

      <div v-if="creature.reactions?.length">
        <h4 class="header_separator">
          <span>Реакции</span>
        </h4>

        <p v-if="creature.reaction">
          <raw-content :template="creature.reaction" />
        </p>

        <div
          v-for="(reaction, key) in creature.reactions"
          :key="key"
        >
          <span class="bestiary_h5">
            <h5>{{ reaction.name }}.</h5>

            <raw-content :template="reaction.value" />
          </span>
        </div>
      </div>

      <div v-if="creature.legendary?.list?.length">
        <h4 class="header_separator">
          <span>Легендарные Действия</span>
        </h4>

        <p v-if="!creature.legendary.description">
          <span>{{ creature.name.rus }}</span> может совершить 3 легендарных
          действия, выбирая из представленных ниже вариантов. За один раз можно
          использовать только одно легендарное действие, и только в конце хода
          другого существа. <span>{{ creature.name.rus }}</span>
          восстанавливает использованные легендарные действия в начале своего
          хода.
        </p>

        <p v-else>
          <raw-content :template="creature.legendary.description" />
        </p>

        <div
          v-for="(action, key) in creature.legendary.list"
          :key="key"
        >
          <span class="bestiary_h5">
            <h5>{{ action.name }}.</h5>

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
            <h5>{{ mystical.name }}.</h5>

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
        <summary class="h4">
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
        <summary class="h4">
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
