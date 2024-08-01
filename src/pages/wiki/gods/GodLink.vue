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
      god: {
        type: Object,
        default: () => ({}),
      },
    },
    setup(props) {
      const { isActive, href, navigate } = useLink(props);

      return {
        href,
        navigate,
        classList: computed(() => ({
          'router-link-active': isActive.value,
          'is-green': props.god?.homebrew,
        })),
      };
    },
  });
</script>

<template>
  <router-link
    custom
    v-bind="$props"
  >
    <a
      ref="god"
      :class="classList"
      :href="href"
      class="link-item"
      v-bind="$attrs"
      @click.left.exact.prevent="navigate()"
    >
      <div class="link-item__content">
        <div
          v-tippy-lazy="{ content: god.alignment }"
          class="link-item__alignment"
        >
          <span>{{ god.shortAlignment }}</span>
        </div>

        <div class="link-item__body">
          <div class="link-item__row">
            <div class="link-item__name">
              <span class="link-item__name--rus">
                {{ god.name.rus }}
              </span>

              <span class="link-item__name--eng"> [{{ god.name.eng }}] </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  </router-link>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/link-item' as *;

  .link-item {
    &__alignment {
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
  }
</style>
