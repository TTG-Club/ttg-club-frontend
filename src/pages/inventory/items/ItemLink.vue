<script lang="ts">
  import { computed, defineComponent } from 'vue';
  import { useLink } from 'vue-router';

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
      item: {
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

              <span class="link-item__name--eng"> [{{ item.name.eng }}] </span>
            </div>

            <div
              v-if="item.source.group"
              v-tippy-lazy="{
                content: item.source.group.name,
                touch: true,
              }"
              :style="{
                '--source-group-color': `var(--badge-${item.source.group?.shortName.toLowerCase()})`,
              }"
              class="link-item__source"
            >
              {{ item.source.group.shortName }}
            </div>
          </div>
        </div>
      </div>
    </a>
  </router-link>
</template>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
