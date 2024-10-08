<script lang="ts">
  import { CapitalizeFirst } from '@/shared/directives/CapitalizeFirst';

  import type { PropType } from 'vue';
  import type { RouteLocationPathRaw } from 'vue-router';

  export default defineComponent({
    directives: {
      CapitalizeFirst,
    },
    inheritAttrs: false,
    props: {
      to: {
        type: Object as PropType<RouteLocationPathRaw>,
        required: true,
      },
      weapon: {
        type: Object,
        default: () => ({}),
      },
    },
    setup(props) {
      const { navigate, isActive, href } = useLink(props);

      const classList = computed(() => ({
        'router-link-active': isActive.value,
      }));

      return {
        href,
        classList,
        navigate,
      };
    },
  });
</script>

<template>
  <router-link
    :to="{ path: weapon.url }"
    custom
    v-bind="$props"
  >
    <a
      :class="classList"
      :href="href"
      class="link-item"
      v-bind="$attrs"
      @click.left.exact.prevent="navigate()"
    >
      <div class="link-item__content">
        <div class="link-item__body">
          <div
            v-if="weapon.name"
            class="link-item__row"
          >
            <div class="link-item__name">
              <span class="link-item__name--rus">
                {{ weapon.name.rus }}
              </span>

              <span
                v-if="weapon.name.eng"
                class="link-item__name--eng"
              >
                [{{ weapon.name.eng }}]
              </span>
            </div>

            <div
              v-if="weapon.source.group"
              v-tippy-lazy="{
                content: weapon.source.group.name,
                touch: true,
              }"
              :style="{
                '--source-group-color': `var(--badge-${weapon.source.group.shortName.toLowerCase()})`,
              }"
              class="link-item__source"
            >
              {{ weapon.source.group.shortName }}
            </div>
          </div>

          <div class="link-item__row">
            <div
              v-if="weapon.damage"
              class="link-item__damage"
            >
              <span
                v-if="weapon.damage.dice"
                v-tippy-lazy="{ content: 'Урон' }"
                class="link-item__damage_dice dice_text"
              >
                {{ weapon.damage.dice }}
              </span>
              &nbsp;
              <span
                v-if="weapon.damage.type"
                v-tippy-lazy="{ content: 'Тип урона' }"
                class="link-item__damage_type"
              >
                {{ weapon.damage.type }}
              </span>
            </div>

            <div
              v-if="weapon.price"
              v-tippy-lazy="{ content: 'Стоимость' }"
              class="link-item__price"
            >
              <span>
                {{ weapon.price ? weapon.price : '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  </router-link>
</template>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
