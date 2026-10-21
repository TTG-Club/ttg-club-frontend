<script lang="ts">
  import type { TSearchResult } from '@/shared/types/search/Search.d';

  import type { PropType } from 'vue';

  export default defineComponent({
    props: {
      searchLink: {
        type: Object as PropType<TSearchResult>,
        default: null,
        required: true,
      },
      showDesc: {
        type: Boolean,
        default: false,
      },
      disableHover: {
        type: Boolean,
        default: false,
      },
      selected: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const link = ref<HTMLElement | null>(null);
      const { focused } = useFocus(link);

      const classes = computed(() => ({
        'is-selected': props.selected,
        'is-hover-disabled': props.disableHover,
        'is-homebrew': props.searchLink.source?.homebrew,
      }));

      watch(
        () => props.selected,
        (value) => {
          focused.value = value;
        },
      );

      return {
        link,
        focused,
        classes,
      };
    },
  });
</script>

<template>
  <router-link
    v-if="searchLink"
    ref="link"
    :class="classes"
    :to="searchLink.url"
    class="search-link"
  >
    <div class="search-link__body">
      <div class="search-link__label">
        {{ searchLink.name }}
        <span class="search-link__label--eng"
          >[{{ searchLink.englishName }}]</span
        >
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

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .search-link {
    user-select: none;
    overflow: hidden;
    display: block;
    color: var(--text-color-title);

    &.is-homebrew {
      background: var(--bg-homebrew-gradient-left);
    }

    &__body {
      padding: 10px 12px;

      @include css-anim();
    }

    &__section {
      display: flex;

      margin-top: 4px;

      font-size: 13px;
      font-style: italic;
      color: var(--text-color);

      opacity: 0.4;
    }

    &__source {
      margin-right: 4px;
    }

    &__desc {
      overflow: hidden;
      display: inline-block;

      max-width: 100%;
      margin-top: 4px;

      color: var(--text-color);
      text-overflow: ellipsis;
      white-space: nowrap;

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
          background: var(--hover);

          @include css-anim();
        }
      }
    }
  }
</style>
