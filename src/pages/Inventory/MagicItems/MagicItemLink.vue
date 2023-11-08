<template>
  <router-link
    :to="{ path: magicItem.url }"
    custom
    v-bind="$props"
  >
    <a
      :class="classList"
      :href="href"
      class="link-item"
      v-bind="$attrs"
      @click.left.exact.prevent="clickHandler"
    >
      <div class="link-item__content">
        <div class="link-item__body">
          <div class="link-item__row">
            <div class="link-item__name">
              <span class="link-item__name--rus">
                {{ magicItem.name.rus }}
              </span>

              <span class="link-item__name--eng">
                [{{ magicItem.name.eng }}]
              </span>
            </div>
          </div>

          <div class="link-item__row">
            <div
              v-capitalize-first
              :class="`is-${magicItem.rarity.type || 'unknown'}`"
              class="link-item__type"
            >
              {{ magicItem.rarity.name }}
            </div>

            <div
              v-if="magicItem.custom?.count > 1"
              class="link-item__count"
            >
              {{ `x${magicItem.custom.count}` }}
            </div>

            <div
              v-if="magicItem.customization"
              class="link-item__customization"
            >
              Настройка
            </div>

            <div
              v-if="inTrader && magicItem.custom"
              class="link-item__price"
            >
              {{ `${price}` }}
            </div>
          </div>
        </div>
      </div>
    </a>
  </router-link>
</template>

<script setup lang="ts" generic="T extends TGroupedTraderLink">
  import { computed } from 'vue';
  import { useLink } from 'vue-router';

  import { CapitalizeFirst as vCapitalizeFirst } from '@/shared/directives/CapitalizeFirst';
  import type { TGroupedTraderLink } from '@/shared/types/Tools/Trader.d';

  import type { RouteLocationPathRaw } from 'vue-router';

  const props = withDefaults(
    defineProps<{
      to: RouteLocationPathRaw;
      magicItem: T;
      inTools?: boolean;
      inTrader?: boolean;
      isActive?: boolean;
    }>(),
    {
      inTools: false,
      inTrader: false,
      isActive: false
    }
  );

  const emit = defineEmits<{ (e: 'select-item'): void }>();

  const { navigate, isActive, href } = useLink(props);

  const classList = computed(() => ({
    'router-link-active': props.isActive || isActive.value,
    'is-green': props.magicItem?.source?.homebrew
  }));

  const clickHandler = () => {
    if (props.inTools) {
      emit('select-item');

      return;
    }

    navigate();
  };

  const price = computed(() => {
    if (typeof props.magicItem.custom?.price === 'number') {
      return `${props.magicItem.custom.price} зм`;
    }

    if (props.magicItem.price) {
      return props.magicItem.price;
    }

    return null;
  });
</script>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/link-item' as *;

  .link-item {
    &__type {
      padding-left: 14px;
      position: relative;
      color: var(--text-g-color);
      font-size: calc(var(--main-font-size) - 1px);
      line-height: normal;

      &:after {
        content: '';
        position: absolute;
        background: var(--border);
        border: 1px solid var(--border);
        border-radius: 50%;
        width: 10px;
        height: 10px;
        display: block;
        left: 0;
        top: 4px;
        //z-index: 1;
      }

      &.is-common {
        &:after {
          background-color: var(--common);
        }
      }

      &.is-uncommon {
        &:after {
          background-color: var(--uncommon);
        }
      }

      &.is-rare {
        &:after {
          background-color: var(--rare);
        }
      }

      &.is-very-rare {
        &:after {
          background-color: var(--very_rare);
        }
      }

      &.is-legendary {
        &:after {
          background-color: var(--legendary);
        }
      }

      &.is-artifact {
        &:after {
          background-color: var(--artifact);
        }
      }

      &.is-varies {
        &:after {
          background: linear-gradient(
            90deg,
            var(--common) 10%,
            var(--artifact) 100%
          );
        }
      }
    }

    &__count {
      margin-left: auto;
    }

    &.router-link-active {
      .link-item {
        &__rating,
        &__type,
        &__count,
        &__price,
        &__customization {
          color: var(--text-btn-color);
        }
      }
    }
  }
</style>
