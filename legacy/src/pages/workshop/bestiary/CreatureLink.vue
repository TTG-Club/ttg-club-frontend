<script>
  import { CapitalizeFirst } from '@/shared/directives/CapitalizeFirst';

  export default {
    directives: {
      CapitalizeFirst,
    },
    props: {
      creature: {
        type: Object,
        required: true,
      },
    },
  };
</script>

<template>
  <router-link
    :to="{ path: creature.url }"
    class="link-item"
  >
    <div class="link-item__content">
      <div class="link-item__rating">
        <span>{{
          'challengeRating' in creature ? creature.challengeRating : '-'
        }}</span>
      </div>

      <div class="link-item__body">
        <div class="link-item__row">
          <div class="link-item__name">
            <span class="link-item__name--rus">
              {{ creature.name.rus }}
            </span>

            <span class="link-item__name--eng">
              [{{ creature.name.eng }}]
            </span>
          </div>

          <div
            v-if="creature.source.group"
            v-tippy-lazy="{
              content: creature.source.group.name,
              touch: true,
            }"
            :style="{
              '--source-group-color': `var(--badge-${creature.source.group.shortName.toLowerCase()})`,
            }"
            class="link-item__source"
          >
            {{ creature.source.group.shortName }}
          </div>
        </div>

        <div class="link-item__row">
          <div
            v-capitalize-first
            class="link-item__type"
          >
            {{ creature.type }}
          </div>
        </div>
      </div>
    </div>
  </router-link>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/link-item' as *;

  .link-item {
    &__rating {
      flex-shrink: 0;

      width: 42px;
      margin-right: 12px;
      margin-left: -8px;

      font-size: 17px;
      color: var(--text-color);

      border-right: 1px solid var(--border);

      span {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 42px;
        height: 42px;
      }
    }

    &__type {
      font-size: calc(var(--main-font-size) - 1px);
      line-height: normal;
      color: var(--text-g-color);
    }

    &.router-link-active {
      .link-item {
        &__rating,
        &__type {
          color: var(--text-btn-color);
        }
      }
    }
  }
</style>
