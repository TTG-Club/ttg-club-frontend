<script setup lang="ts">
  import { omit } from 'lodash-es';

  import { useUIStore } from '@/shared/stores/UIStore';
  import type { TClassItem } from '@/shared/types/character/Classes.d';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import { isIconExist } from '@/shared/utils/icons';

  import type { RouteLocationPathRaw } from 'vue-router';

  defineOptions({
    inheritAttrs: false,
  });

  const props = withDefaults(
    defineProps<{
      to: RouteLocationPathRaw;
      classItem: TClassItem | null;
      afterSearch?: boolean;
    }>(),
    {
      classItem: null,
      afterSearch: false,
    },
  );

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isActive, navigate } = useLink(props);

  const submenu = ref(false);

  const getClassList = computed(() => ({
    'router-link-active':
      isActive.value ||
      route.params.className ===
        router.resolve(props.classItem?.url || '')?.params?.className,
    'is-selected': route.name === 'classDetail',
    'is-green': props.classItem?.source?.homebrew,
  }));

  const hasArchetypes = computed(() => !!props.classItem?.archetypes?.length);

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
        router.resolve(props.classItem?.url || '')?.params?.className;
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
</script>

<template>
  <router-link
    v-if="classItem"
    v-slot="{ href }"
    :to="{ path: classItem.url }"
    custom
    v-bind="omit($props, 'to')"
  >
    <div
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

              <n-flex
                :style="{ marginTop: 'auto' }"
                size="small"
              >
                <n-tag
                  type="primary"
                  round
                  size="small"
                  :color="{
                    color: 'var(--primary-active)',
                    textColor: 'var(--text-btn-color)',
                  }"
                >
                  {{ classItem.dice }}
                </n-tag>

                <n-tooltip>
                  <template #trigger>
                    <n-tag
                      type="primary"
                      round
                      size="small"
                      :color="{
                        color: 'var(--primary-active)',
                        textColor: 'var(--text-btn-color)',
                      }"
                    >
                      {{ classItem.source.shortName }}
                    </n-tag>
                  </template>

                  <template #default>
                    {{ classItem.source.name }}
                  </template>
                </n-tooltip>
              </n-flex>
            </span>
          </a>

          <n-tooltip
            v-if="hasArchetypes"
            placement="left"
          >
            <template #trigger>
              <button
                class="link-item-expand__toggle"
                type="button"
                @click.left.exact.prevent="toggleArch"
              >
                <svg-icon :icon="submenu ? 'minus' : 'plus'" />
              </button>
            </template>

            <template #default>
              {{ classItem.archetypeName }}
            </template>
          </n-tooltip>
        </div>

        <n-collapse-transition :show="submenu">
          <div
            v-if="hasArchetypes"
            class="link-item-expand__arch-list"
          >
            <div
              v-for="(group, groupKey) in classItem.archetypes"
              :key="groupKey"
              class="link-item-expand__arch-type"
            >
              <div
                v-if="group.group"
                class="link-item-expand__arch-type_name"
              >
                {{ group.group.name }}
              </div>

              <div class="link-item-expand__arch-type_items">
                <router-link
                  v-for="(arch, archKey) in group.list"
                  :key="archKey"
                  :to="{ path: arch.url }"
                  class="link-item-expand__arch-item"
                >
                  <span class="link-item-expand__arch-item_name">
                    {{ arch.name.rus }}
                  </span>

                  <span class="link-item-expand__arch-item_book">
                    <n-tooltip>
                      <template #trigger>
                        <span>
                          {{ arch.source.shortName }}
                        </span>
                      </template>

                      <template #default>
                        {{ arch.source.name }}
                      </template>
                    </n-tooltip>

                    /

                    <span>{{ arch.name.eng }}</span>
                  </span>
                </router-link>
              </div>
            </div>
          </div>
        </n-collapse-transition>
      </div>
    </div>
  </router-link>
</template>

<style
  lang="scss"
  scoped
  src="@/assets/styles/modules/link-item-expand.scss"
></style>
