<template>
  <router-link
    :to="{ path: item.url }"
    custom
    v-bind="$props"
  >
    <a
      ref="itemItem"
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
                {{ item.name.rus }}
              </span>

              <span class="link-item__name--eng">
                [{{ item.name.eng }}]
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  </router-link>
</template>

<script lang="ts">
  import type { RouteLocationPathRaw } from 'vue-router';
  import { useLink } from 'vue-router';
  import type { PropType } from 'vue';
  import { computed, defineComponent } from 'vue';
  import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';

  export default defineComponent({
    directives: {
      CapitalizeFirst
    },
    inheritAttrs: false,
    props: {
      to: {
        type: Object as PropType<RouteLocationPathRaw>,
        required: true
      },
      item: {
        type: Object,
        default: () => ({})
      }
    },
    setup(props) {
      const {
        navigate,
        isActive,
        href
      } = useLink(props);

      const classList = computed(() => ({
        'router-link-active': isActive.value,
        'is-green': props.item?.homebrew
      }));

      return {
        href,
        classList,
        navigate
      };
    }
  });
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
