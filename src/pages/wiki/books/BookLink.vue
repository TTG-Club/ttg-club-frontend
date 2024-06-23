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
      book: {
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
          'is-green': props.book?.source?.homebrew,
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
      ref="bookItem"
      :class="classList"
      :href="href"
      class="link-item"
      v-bind="$attrs"
      @click.left.exact.prevent="navigate()"
    >
      <div class="link-item__content">
        <div class="link-item__body">
          <div class="link-item__row">
            <div class="link-item__name">
              <span class="link-item__name--rus">
                {{ book.name.rus }}
              </span>

              <span class="link-item__name--eng"> [{{ book.name.eng }}] </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  </router-link>
</template>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
