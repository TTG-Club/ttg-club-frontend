<script lang="ts">
  import { groupBy, isArray, omit, sortBy } from 'lodash-es';

  import { useUIStore } from '@/shared/stores/UIStore';
  import type { TRaceLink } from '@/shared/types/character/Races.d';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import type { PropType } from 'vue';
  import type { RouteLocationPathRaw } from 'vue-router';

  export default defineComponent({
    components: { SvgIcon },
    inheritAttrs: false,
    props: {
      to: {
        type: Object as PropType<RouteLocationPathRaw>,
        required: true,
      },
      raceItem: {
        type: Object as PropType<TRaceLink>,
        required: true,
      },
      isAbilityCalc: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const route = useRoute();

      const { isActive, navigate, href } = useLink(props);

      const uiStore = useUIStore();
      const submenu = ref(false);

      const abilities = computed(() => {
        if (!props.raceItem.abilities.length) {
          return '';
        }

        if (props.raceItem.abilities.length === 6) {
          return '+1 к каждой';
        }

        const abilitiesList = [];

        for (const ability of props.raceItem.abilities) {
          abilitiesList.push(
            ability.value
              ? `${ability.shortName} ${
                  ability.value > 0 ? `+${ability.value}` : ability.value
                }`
              : ability.name,
          );
        }

        return abilitiesList.join(', ');
      });

      const subRaces = computed(() => {
        if (props.isAbilityCalc) {
          return null;
        }

        if (isArray(props.raceItem.subraces)) {
          return sortBy(
            Object.values(
              groupBy(props.raceItem.subraces, (o) => o.type.name),
            ).map((value) => ({
              name: value[0].type,
              list: value,
            })),
            [(o) => o.name.order],
          );
        }

        return null;
      });

      const hasSubRaces = computed(() => !!subRaces.value?.length);

      const parentClassList = computed(() => ({
        'router-link-active': isActive.value,
        'is-selected': route.name === 'raceDetail',
        'is-green': props.raceItem.type.name.toLowerCase() === 'homebrew',
        'is-fullscreen': uiStore.fullscreen,
        'is-ability-calc': props.isAbilityCalc,
      }));

      const selectRace = async () => {
        if (!props.isAbilityCalc) {
          if (!uiStore.isMobile) {
            submenu.value = true;
          }

          await navigate();

          return;
        }

        window.open(href.value, '_blank')?.focus();
      };

      return {
        submenu,
        abilities,
        subRaces,
        hasSubRaces,
        parentClassList,
        selectRace,
      };
    },
    methods: { omit },
  });
</script>

<template>
  <router-link
    v-slot="{ href }"
    :to="{ path: raceItem.url }"
    custom
    v-bind="omit($props, 'to')"
  >
    <div
      :class="parentClassList"
      class="link-item-expand"
      v-bind="$attrs"
    >
      <div class="link-item-expand__content">
        <img
          v-lazy="raceItem.image"
          alt="img-bg"
          class="link-item-expand__content__img-bg"
        />

        <div class="link-item-expand__content__gradient" />

        <div class="link-item-expand__main">
          <a
            :href="href"
            class="link-item-expand__link"
            @click.left.prevent.exact="selectRace"
          >
            <span class="link-item-expand__body">
              <span class="link-item-expand__body_row">
                <span class="link-item-expand__name">
                  <span class="link-item-expand__name--rus">
                    {{ raceItem.name.rus }}
                  </span>

                  <span class="link-item-expand__name--eng">
                    {{ raceItem.name.eng }}
                  </span>
                </span>
              </span>

              <n-flex
                :style="{ marginTop: 'auto' }"
                size="small"
              >
                <n-tag
                  v-if="abilities"
                  round
                  size="small"
                  :color="{
                    color: 'var(--primary-active)',
                    textColor: 'var(--text-btn-color)',
                  }"
                >
                  {{ abilities }}
                </n-tag>

                <n-tooltip>
                  <template #trigger>
                    <n-tag
                      round
                      size="small"
                      :color="{
                        color: 'var(--primary-active)',
                        textColor: 'var(--text-btn-color)',
                      }"
                    >
                      {{ raceItem.source.shortName }}
                    </n-tag>
                  </template>

                  <template #default>
                    {{ raceItem.source.name }}
                  </template>
                </n-tooltip>
              </n-flex>
            </span>
          </a>

          <n-tooltip
            v-if="!isAbilityCalc && hasSubRaces"
            placement="left"
          >
            <template #trigger>
              <button
                :class="{ 'is-active': submenu }"
                class="link-item-expand__toggle"
                type="button"
                @click.left.exact.prevent="submenu = !submenu"
              >
                <svg-icon :icon="submenu ? 'minus' : 'plus'" />
              </button>
            </template>

            <template #default> Разновидности </template>
          </n-tooltip>
        </div>

        <n-collapse-transition :show="submenu">
          <div
            v-if="!isAbilityCalc && hasSubRaces"
            class="link-item-expand__arch-list"
          >
            <div
              v-for="(group, groupKey) in subRaces"
              :key="groupKey"
              class="link-item-expand__arch-type"
            >
              <div class="link-item-expand__arch-type_name">
                {{ group.name.name }}
              </div>

              <div class="link-item-expand__arch-type_items">
                <router-link
                  v-for="(subRace, subRaceKey) in group.list"
                  :key="subRaceKey"
                  :to="{ path: subRace.url }"
                  class="link-item-expand__arch-item"
                >
                  <span class="link-item-expand__arch-item_name">{{
                    subRace.name.rus
                  }}</span>

                  <span class="link-item-expand__arch-item_book">
                    <n-tooltip>
                      <template #trigger>
                        <span>
                          {{ subRace.source.shortName }}
                        </span>
                      </template>

                      <template #default> {{ subRace.source.name }} </template>
                    </n-tooltip>

                    /

                    <span>{{ subRace.name.eng }}</span>
                  </span>
                </router-link>
              </div>
            </div>
          </div>
        </n-collapse-transition>
      </div>
    </div>
  </router-link>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/link-item-expand' as *;
  @use '@/assets/styles/variables/breakpoints' as *;

  .link-item-expand {
    &__main {
      height: 122px;

      @include media-min($sm) {
        height: 160px;
      }
    }

    &__body {
      height: 100%;

      &_row {
        margin: 0;

        & + & {
          margin-top: auto;
        }
      }
    }

    &.is-ability-calc {
      height: 100%;

      .link-item-expand {
        &__content {
          height: 100%;
        }

        &__main {
          height: 100%;
        }
      }
    }
  }
</style>
