<template>
  <div class="race-body">
    <detail-top-bar
      :source="race.source"
    />

    <div class="content-padding">
      <ui-easy-lightbox
        :images="race.images"
        :use-bg-hide="false"
      />

      <div class="scores">
        <div class="scores__stats">
          <h4>
            <strong
              v-tippy="'Тип существа'"
            >ТИП</strong>
          </h4>

          <p>{{ race.type || '' }}</p>
        </div>

        <div class="scores__stats">
          <h4>
            <strong
              v-tippy="'Увеличение характеристик'"
            >ХАР</strong>
          </h4>

          <p v-if="abilities">
            {{ abilities }}
          </p>
        </div>

        <div class="scores__stats">
          <h4>
            <strong
              v-tippy="'Размер'"
            >РАЗ</strong>
          </h4>

          <p>{{ race.size }}</p>
        </div>

        <div class="scores__stats">
          <h4>
            <strong
              v-tippy="'Скорость'"
            >СКР</strong>
          </h4>

          <p>{{ speed }}</p>
        </div>

        <div
          v-if="race.darkvision"
          class="scores__stats"
        >
          <h4>
            <strong
              v-tippy="'Темное зрение'"
            >ТЗ</strong>
          </h4>

          <p>{{ `${ race.darkvision } фт.` }}</p>
        </div>
      </div>

      <details
        v-for="(skill, key) in skills"
        :key="key"
        :class="{ archetype_feet: skill.subrace }"
        :open="skill.opened"
      >
        <summary class="h4">
          <span>{{ skill.name }}</span>
        </summary>

        <div class="content">
          <raw-content
            v-if="skill.description"
            :template="skill.description"
          />
        </div>
      </details>

      <details>
        <summary class="h4">
          <span>Описание</span>
        </summary>

        <div class="content">
          <raw-content
            v-if="race.description"
            :template="race.description"
          />
        </div>
      </details>

      <template v-if="race.subraces">
        <h4>
          Разновидности
        </h4>

        <details
          v-for="(subrace, subraceKey) in race.subraces"
          :key="subraceKey"
          class="spoiler feet_show"
        >
          <summary class="h4">
            <span>{{ subrace.name.rus }}</span>

            <span>{{ subrace.source.shortName }}</span>
          </summary>

          <div class="content">
            <raw-content
              v-if="subrace.description"
              :template="subrace.description"
            />

            <div
              v-for="(skill, skillKey) in subrace.skills"
              :key="skillKey"
            >
              <h4 class="header_separator">
                <span>{{ skill.name }}</span>
              </h4>

              <raw-content
                v-if="skill.description"
                :template="skill.description"
              />
            </div>
          </div>
        </details>
      </template>
    </div>
  </div>
</template>

<script>
  import sortBy from 'lodash/sortBy';
  import RawContent from '@/components/content/RawContent.vue';
  import DetailTopBar from '@/components/UI/DetailTopBar.vue';
  import UiEasyLightbox from '@/components/UI/kit/UiEasyLightbox.vue';

  export default {
    name: 'RaceBody',
    components: {
      UiEasyLightbox,
      DetailTopBar,
      RawContent
    },
    props: {
      race: {
        type: Object,
        default: undefined,
        required: true
      }
    },
    computed: {
      abilities() {
        if (!this.race.abilities?.length) {
          return '';
        }

        const abilities = [];

        for (const ability of this.race.abilities) {
          abilities.push(ability.value
            ? `${ ability.shortName } ${ ability.value > 0 ? `+${ ability.value }` : ability.value }`
            : ability.name);
        }

        return abilities.join(', ');
      },

      speed() {
        if (!this.race.speed?.length) {
          return '';
        }

        const speeds = [];

        for (const speed of this.race.speed) {
          speeds.push(`${ speed.name ? `${ speed.name } ` : '' }${ speed.value } фт.`);
        }

        return speeds.join(', ');
      },

      skills() {
        return sortBy(this.race.skills, [o => o.opened, o => !o.subrace]);
      }
    }
  };
</script>
