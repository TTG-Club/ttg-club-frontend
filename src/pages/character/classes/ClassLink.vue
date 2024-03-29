<script lang="ts">
  import {
    computed,
    defineComponent,
    nextTick,
    onMounted,
    ref,
    watch,
  } from 'vue';
  import { useLink, useRoute, useRouter } from 'vue-router';

  import { useUIStore } from '@/shared/stores/UIStore';
  import type { TClassItem } from '@/shared/types/character/Classes.d';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import { isIconExist } from '@/shared/utils/icons';

  import type { PropType } from 'vue';
  import type { RouteLocationPathRaw } from 'vue-router';

  export default defineComponent({
    components: { SvgIcon },
    inheritAttrs: false,
    props: {
      to: {
        type: Object as PropType<RouteLocationPathRaw>,
        required: true,
      },
      classItem: {
        type: Object as PropType<TClassItem>,
        default: () => null,
        required: true,
      },
      afterSearch: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const route = useRoute();
      const router = useRouter();
      const uiStore = useUIStore();

      const { isActive, navigate } = useLink(props);

      const submenu = ref(false);

      const getClassList = computed(() => ({
        'router-link-active':
          isActive.value ||
          route.params.className ===
            router.resolve(props.classItem.url)?.params?.className,
        'is-selected': route.name === 'classDetail',
        'is-green': props.classItem?.source?.homebrew,
      }));

      const hasArchetypes = computed(
        () => !!props.classItem?.archetypes?.length,
      );

      const toggleArch = () => {
        submenu.value = !submenu.value;
      };

      const selectClass = () => {
        if (!uiStore.isMobile) {
          submenu.value = true;
        }

        navigate();
      };

      onMounted(() => {
        nextTick(() => {
          submenu.value =
            route.params.className ===
            router.resolve(props.classItem.url)?.params?.className;
        });
      });

      watch(
        () => props.afterSearch,
        (value) => {
          if (value) {
            submenu.value = value;

            return;
          }

          submenu.value = false;
        },
      );

      return {
        submenu,
        getClassList,
        hasArchetypes,
        toggleArch,
        selectClass,
      };
    },
    methods: { isIconExist },
  });
</script>

<template>
  <router-link
    v-slot="{ href }"
    :to="{ path: classItem.url }"
    custom
    v-bind="$props"
  >
    <div
      ref="classItem"
      :class="getClassList"
      class="link-item-expand"
      v-bind="$attrs"
    >
      <div class="link-item-expand__content">
        <img
          v-lazy="classItem.image"
          alt="img-bg"
          class="link-item-expand__content__img-bg"
        />

        <div class="link-item-expand__content__gradient" />

        <div class="link-item-expand__main">
          <a
            :href="href"
            class="link-item-expand__link"
            @click.left.prevent.exact="selectClass"
          >
            <span class="link-item-expand__body">
              <span class="link-item-expand__body_row">
                <span
                  v-if="isIconExist(classItem.icon)"
                  class="link-item-expand__icon"
                >
                  <svg-icon
                    :icon="classItem.icon"
                    size="32"
                  />
                </span>

                <span class="link-item-expand__name">
                  <span class="link-item-expand__name--rus">
                    {{ classItem.name.rus }}
                  </span>

                  <span class="link-item-expand__name--eng">
                    {{ classItem.name.eng }}
                  </span>
                </span>
              </span>

              <span class="link-item-expand__body_row">
                <span class="link-item-expand__tag">
                  {{ classItem.dice }}
                </span>

                <span
                  v-tippy-lazy="{ content: classItem.source.name }"
                  class="link-item-expand__tag"
                >
                  {{ classItem.source.shortName }}
                </span>
              </span>
            </span>
          </a>

          <button
            v-if="hasArchetypes"
            v-tippy-lazy="{
              content: classItem.archetypeName,
              placement: 'left',
            }"
            class="link-item-expand__toggle"
            type="button"
            @click.left.exact.prevent="toggleArch"
          >
            <svg-icon :icon="submenu ? 'minus' : 'plus'" />
          </button>
        </div>

        <transition
          mode="out-in"
          name="fade"
        >
          <div
            v-if="hasArchetypes"
            v-show="submenu"
            class="link-item-expand__arch-list"
          >
            <div
              v-for="(group, groupKey) in classItem.archetypes"
              :key="groupKey"
              class="link-item-expand__arch-type"
            >
              <div class="link-item-expand__arch-type_name">
                {{ group.group.name }}
              </div>

              <div class="link-item-expand__arch-type_items">
                <router-link
                  v-for="(arch, archKey) in group.list"
                  :key="archKey"
                  :to="{ path: arch.url }"
                  class="link-item-expand__arch-item"
                >
                  <span class="link-item-expand__arch-item_name">{{
                    arch.name.rus
                  }}</span>

                  <span class="link-item-expand__arch-item_book">
                    <span v-tippy-lazy="{ content: arch.source.name }">
                      {{ arch.source.shortName }}
                    </span>

                    /

                    <span>{{ arch.name.eng }}</span>
                  </span>
                </router-link>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </router-link>
</template>

<style
  lang="scss"
  scoped
  src="@/assets/styles/modules/link-item-expand.scss"
></style>
