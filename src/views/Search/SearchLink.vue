<template>
  <router-link
    v-if="searchLink"
    ref="link"
    :class="classes"
    :to="{ path: searchLink.url }"
    class="search-link"
  >
    <div class="search-link__body">
      <div class="search-link__label">
        {{ searchLink.name }}
        <span class="search-link__label--eng">[{{ searchLink.englishName }}]</span>
      </div>

      <div class="search-link__section">
        <div
          v-if="searchLink.source"
          v-tippy-lazy="{ content: searchLink.source.name }"
          class="search-link__source"
        >
          ({{ searchLink.source.shortName }})
        </div>
        {{ searchLink.section }}
      </div>

      <div
        v-if="searchLink.description && showDesc"
        class="search-link__desc"
      >
        {{ searchLink.description }}
      </div>
    </div>
  </router-link>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import {
    computed, defineComponent, ref, watch
  } from 'vue';
  import { useFocus } from '@vueuse/core';
  import type { TSearchResult } from '@/types/Search/Search.types';

  export default defineComponent({
    props: {
      searchLink: {
        type: Object as PropType<TSearchResult>,
        default: null,
        required: true
      },
      showDesc: {
        type: Boolean,
        default: false
      },
      disableHover: {
        type: Boolean,
        default: false
      },
      selected: {
        type: Boolean,
        default: false
      }
    },
    setup(props) {
      const link = ref<HTMLElement | null>(null);
      const { focused } = useFocus(link);

      const classes = computed(() => ({
        'is-selected': props.selected,
        'is-hover-disabled': props.disableHover,
        'is-homebrew': props.searchLink.source?.homebrew
      }));

      watch(
        () => props.selected,
        value => {
          focused.value = value;
        }
      );

      return {
        link,
        focused,
        classes
      };
    }
  });
</script>

<style lang="scss" scoped>
  .search-link {
    display: block;
    color: var(--text-color-title);
    user-select: none;
    overflow: hidden;

    &.is-homebrew {
      background: var(--bg-homebrew-gradient-left);
    }

    &__body {
      @include css_anim();

      padding: 10px 12px;
    }

    &__section {
      margin-top: 4px;
      font-style: italic;
      font-size: 13px;
      opacity: .4;
      color: var(--text-color);
      display: flex;

    }

    &__source {
      margin-right: 4px;
    }

    &__desc {
      margin-top: 4px;
      color: var(--text-color);
      white-space: nowrap;
      max-width: 100%;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;

      @include media-min($xl) {
        white-space: initial;
      }
    }

    &__label {
      &--eng {
        color: var(--text-g-color);
      }
    }

    &:hover {
      &:not(.is-hover-disabled):not(.is-selected) {
        .search-link {
          &__body {
            background: var(--hover);
          }
        }
      }
    }

    &.is-selected {
      .search-link {
        &__body {
          @include css_anim();

          background: var(--hover);
        }
      }
    }
  }
</style>
