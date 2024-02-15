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
    :class="{ 'is-green': creature?.source?.homebrew }"
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
      width: 42px;
      flex-shrink: 0;
      font-size: 17px;
      color: var(--text-color);
      border-right: 1px solid var(--border);
      margin-right: 12px;
      margin-left: -8px;

      span {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &__type {
      color: var(--text-g-color);
      font-size: calc(var(--main-font-size) - 1px);
      line-height: normal;
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
