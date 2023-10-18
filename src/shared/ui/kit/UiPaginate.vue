<template>
  <vue-paginate
    :no-li-surround="true"
    active-class="is-active"
    container-class="ui-paginate"
    disabled-class="is-disabled"
    next-link-class="ui-paginate__next"
    page-link-class="ui-paginate__page"
    prev-link-class="ui-paginate__prev"
    v-bind="props"
    @update:model-value="$emit('update:model-value', $event)"
  >
    <template #prevBtnText>
      <svg-icon icon="arrow/left" />
    </template>

    <template #nextBtnText>
      <svg-icon icon="arrow/right" />
    </template>
  </vue-paginate>
</template>

<script setup lang="ts">
  import { VuePaginate } from '@svifty7/vue-paginate';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  import type { TVuePaginateProps } from '@svifty7/vue-paginate/types/VuePaginate';

  const props =
    defineProps<
      Omit<
        TVuePaginateProps,
        | 'noLiSurround'
        | 'activeClass'
        | 'containerClass'
        | 'disabledClass'
        | 'nextLinkClass'
        | 'pageLinkClass'
        | 'prevLinkClass'
      >
    >();
</script>

<style lang="scss">
  @use '@/assets/styles/variables/mixins' as *;

  .ui-paginate {
    display: inline-flex;
    gap: 8px;
    user-select: none;

    &__prev,
    &__next,
    &__page {
      @include css_anim();

      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      font-weight: 700;
      font-size: 12px;
      line-height: 16px;
      text-align: center;
      letter-spacing: 0.44px;
      color: var(--text-color);
      border: {
        width: 1px;
        style: solid;
        color: var(--border);
        radius: 4px;
      }
    }

    &__page {
      &.is-active {
        @include css_anim();

        border-color: var(--primary);
        background: var(--primary);
        color: var(--text-btn-color);
      }

      &:hover {
        &:not(.is-active):not(.is-disabled) {
          border-color: var(--primary-hover);
          background: var(--primary-hover);
          color: var(--text-btn-color);
        }
      }
    }

    &__prev,
    &__next {
      color: var(--primary);
      border-color: var(--primary);

      svg {
        width: 21px;
        height: 21px;
      }

      &.is-disabled {
        @include css_anim();

        background: var(--hover);
        border-color: var(--hover);
        color: var(--text-color);
        opacity: 0.4;
      }

      &:hover {
        &:not(.is-active):not(.is-disabled) {
          border-color: var(--primary-hover);
          background: var(--primary-hover);
          color: var(--text-btn-color);
        }
      }
    }
  }
</style>
