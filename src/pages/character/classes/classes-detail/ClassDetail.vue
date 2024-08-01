<script setup lang="ts">
  import { cloneDeep, groupBy, isArray, sortBy } from 'lodash-es';
  import VueEasyLightbox from 'vue-easy-lightbox';

  import { httpClient } from '@/shared/api';
  import { DEFAULT_QUERY_BOOKS_INJECT_KEY } from '@/shared/const';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type { TName, TSource } from '@/shared/types/BaseApiFields';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import RawContent from '@/shared/ui/RawContent.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import OptionsView from '@/pages/character/options/OptionsView.vue';
  import SpellsView from '@/pages/character/spells/SpellsView.vue';

  import type { SelectGroupOption } from 'naive-ui';
  import type {
    RouteLocationNormalizedLoaded,
    RouteLocationPathRaw,
  } from 'vue-router';

  interface IEmit {
    (e: 'scroll-to-active'): void;
    (
      e: 'scroll-to-last-active',
      href: RouteLocationNormalizedLoaded['path'],
    ): void;
  }

  const emit = defineEmits<IEmit>();

  const route = useRoute();
  const router = useRouter();

  const { isMobile } = storeToRefs(useUIStore());

  const queryBooks = computedInject(
    DEFAULT_QUERY_BOOKS_INJECT_KEY,
    (source) => resolveUnref(source),
    [],
  );

  const loading = ref(true);
  const error = ref(false);

  const currentClass = ref<
    unknown & {
      archetypes?: Array<ClassItemArchetype>;
    }
  >();

  const currentTab = ref(undefined);
  const tabs = ref([]);
  const abortController = ref();

  const gallery = ref<{
    show: boolean;
    index: number;
  }>({
    show: false,
    index: 0,
  });

  const classBody = ref<HTMLDivElement>();
  const fixed = ref<HTMLDivElement>();

  const { height: fixedHeight } = useElementBounding(fixed);

  const { y: bodyScroll } = useScroll(classBody, {
    behavior: 'smooth',
  });

  const getStoreKey = computed(() =>
    `${
      currentClass.value.name.eng +
      currentTab.value.type +
      currentTab.value.order
    }`.replace(/\s/g, ''),
  );

  interface ClassItemArchetypeType {
    name: string;
    order: number;
  }

  interface ClassItemArchetype {
    name: TName;
    type: ClassItemArchetypeType;
    source: TSource;
    url: string;
  }

  const currentArchetypes = computed<Array<SelectGroupOption>>(() => {
    const getArchetypes = (
      list: Array<ClassItemArchetype>,
    ): Array<SelectGroupOption> =>
      sortBy(
        Object.values(groupBy(list, (o) => o.type.name)).map((value) => ({
          type: 'group',
          key: value[0].type.order,
          label: value[0].type.name,
          children: value.map((el) => ({
            label: `${el.name.rus} [${el.source.shortName}]`,
            value: el.url,
          })),
        })),
        [(o) => o.key],
      );

    if (
      !isArray(currentClass.value?.archetypes) ||
      !currentClass.value.archetypes.length
    ) {
      return [];
    }

    return getArchetypes(currentClass.value.archetypes);
  });

  const currentSelectArchetype = computed<
    ClassItemArchetype['url'] | undefined
  >(() => {
    if (
      !isArray(currentClass.value?.archetypes) ||
      !currentClass.value.archetypes.length
    ) {
      return undefined;
    }

    return currentClass.value.archetypes.find(
      (archetype) => archetype.url === route.path,
    )?.url;
  });

  const getUpdatedClass = (classInfo) => {
    const updatedClass = cloneDeep(classInfo);

    if (!updatedClass.images || !Array.isArray(updatedClass.images)) {
      updatedClass.images = [];
    }

    if (!updatedClass.images.length && updatedClass.image) {
      updatedClass.images.unshift(updatedClass.image);
    }

    return updatedClass;
  };

  const setTab = (index) => {
    try {
      loading.value = true;

      currentTab.value = tabs.value[index];
      loading.value = false;

      nextTick(() => {
        bodyScroll.value = 0;
      });
    } catch (err) {
      loading.value = false;
      error.value = true;

      errorHandler(err);
    }
  };

  const showGallery = () => {
    if (!currentClass.value?.images?.length) {
      return;
    }

    gallery.value.show = true;
    gallery.value.index = 0;
  };

  const initTabs = async (loadedClass) => {
    tabs.value = sortBy(loadedClass.tabs, ['order']);

    if (isArray(loadedClass.images) && loadedClass.images?.length) {
      tabs.value.push({
        type: 'images',
        name: 'Галерея',
        order: tabs.value.length,
        callback: showGallery,
      });
    }

    await setTab(0);
  };

  const classInfoQuery = async (url) => {
    if (abortController.value instanceof AbortController) {
      abortController.value.abort();
    }

    try {
      error.value = false;
      loading.value = true;
      abortController.value = new AbortController();

      const resp = await httpClient.post({
        url,
        payload: {
          filter: {
            book: resolveUnref<Array<string>>(queryBooks),
          },
        },
        signal: abortController.value.signal,
      });

      const classInfo = getUpdatedClass(resp.data);

      await initTabs(classInfo);

      currentClass.value = classInfo;
    } catch (err) {
      errorHandler(err);

      error.value = true;
    } finally {
      loading.value = false;
      abortController.value = null;
    }
  };

  const clickTabHandler = async ({ index, callback }) => {
    if (typeof callback === 'function') {
      callback();

      return;
    }

    await setTab(index);
  };

  const goToArchetype = (path: RouteLocationPathRaw['path']) =>
    router.push({ path });

  const scrollToSection = (hash: string) => {
    if (!hash || !(classBody.value instanceof HTMLDivElement)) {
      return;
    }

    const formattedHash = hash.startsWith('#') ? hash : `#${hash}`;

    const section = classBody.value.querySelector(formattedHash).parentElement;

    if (!section) {
      return;
    }

    if (route.hash !== formattedHash) {
      router.replace({
        path: route.path,
        hash: formattedHash,
      });
    }

    bodyScroll.value = section.offsetTop - fixedHeight.value;
  };

  const anchorClickHandler = (e) => {
    if (e.button) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const { target } = e;

    const hash = target.getAttribute('href').replace('#', '').trim();

    if (hash) {
      scrollToSection(hash);
    }
  };

  const getAnchorLinks = () => {
    if (!(classBody.value instanceof HTMLDivElement)) {
      return [];
    }

    const nodeList = classBody.value.querySelectorAll('[href^="#"]');

    return Array.from(nodeList).filter(
      (link) => !!link.getAttribute('href').replace('#', '').trim(),
    );
  };

  const initScrollListeners = () => {
    if (!(classBody.value instanceof HTMLDivElement)) {
      return;
    }

    if (route.hash) {
      scrollToSection(route.hash);
    }

    for (const link of getAnchorLinks()) {
      link.addEventListener('click', anchorClickHandler);
    }
  };

  const removeScrollListeners = () => {
    for (const link of getAnchorLinks()) {
      link.removeEventListener('click', anchorClickHandler);
    }
  };

  const close = () => {
    router.push({ name: 'classes' });
  };

  onMounted(async () => {
    await classInfoQuery(route.path);

    emit('scroll-to-active');
  });

  onBeforeUnmount(() => {
    removeScrollListeners();
  });

  onBeforeRouteUpdate(async (to, from, next) => {
    if (to.path !== from.path) {
      removeScrollListeners();

      await classInfoQuery(to.path);
    }

    next();
  });

  onBeforeRouteLeave((to, from) => {
    if (to.name !== 'classes') {
      return;
    }

    emit('scroll-to-last-active', from.path);
  });
</script>

<template>
  <content-detail
    class="class-detail"
    :entity-name="currentClass ? `${currentClass.name.rus} (класс)` : undefined"
  >
    <template #fixed>
      <div
        ref="fixed"
        class="class-detail__fixed"
      >
        <section-header
          :copy="!error && !loading"
          :subtitle="currentClass?.name?.eng || ''"
          :title="currentClass?.name?.rus || ''"
          bookmark
          fullscreen
          print
          @close="close"
        />

        <div
          v-if="isMobile && currentArchetypes.length"
          class="class-detail__select"
        >
          <n-select
            :options="currentArchetypes"
            :value="currentSelectArchetype"
            :placeholder="`--- ${currentClass?.archetypeName} ---`"
            :show-checkmark="false"
            @update:value="goToArchetype"
          />
        </div>

        <n-flex
          v-if="tabs.length"
          class="class-detail__tabs"
        >
          <n-button
            v-for="(tab, tabKey) in tabs"
            :key="tabKey"
            :type="currentTab?.name === tab.name ? 'primary' : 'default'"
            @click.left.exact.prevent="
              clickTabHandler({ index: tabKey, callback: tab.callback })
            "
          >
            <template
              v-if="!tab.name"
              #icon
            >
              <svg-icon :icon="`tab-${tab.type}`" />
            </template>

            <template
              v-else
              #default
            >
              {{ tab.name }}
            </template>
          </n-button>
        </n-flex>
      </div>
    </template>

    <template #default>
      <div
        v-if="currentClass"
        class="class-detail__content"
      >
        <div
          v-if="currentTab?.type !== 'spells' && currentTab?.type !== 'options'"
          ref="classBody"
          class="class-detail__body"
        >
          <div
            v-if="currentTab?.url"
            class="class-detail__body--inner"
          >
            <raw-content
              :url="currentTab.url"
              @loaded="initScrollListeners"
              @before-unmount="removeScrollListeners"
            />
          </div>
        </div>

        <spells-view
          v-else-if="currentTab?.type === 'spells'"
          :filter-url="currentTab.url"
          :store-key="getStoreKey"
          :query-books="queryBooks"
          in-tab
        />

        <options-view
          v-else-if="currentTab?.type === 'options'"
          :filter-url="currentTab.url"
          :store-key="getStoreKey"
          :query-books="queryBooks"
          in-tab
        />
      </div>

      <vue-easy-lightbox
        v-if="currentClass?.images?.length"
        :imgs="currentClass?.images"
        :index="gallery.index"
        :visible="gallery.show"
        loop
        move-disabled
        scroll-disabled
        teleport="body"
        @hide="gallery.show = false"
      >
        <template #toolbar />
      </vue-easy-lightbox>
    </template>
  </content-detail>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/mixins' as *;
  @use '@/assets/styles/variables/breakpoints' as *;

  .class-detail {
    overflow: hidden;
    display: flex;
    flex-direction: column;

    width: 100%;
    height: 100%;

    &__loader {
      display: flex;
      align-items: center;
      justify-content: center;

      width: 100%;
      height: 100%;

      &_img {
        position: relative;

        display: flex;
        align-items: center;
        justify-content: center;

        width: 70%;

        &::before {
          content: '';
          display: block;
          width: 100%;
          padding-bottom: 100%;
        }

        img {
          position: absolute;

          width: 100%;
          height: 100%;

          object-fit: contain;
          filter: drop-shadow(0 0 12px var(--bg-main));
        }
      }
    }

    &__tabs {
      padding: 16px 16px 8px;

      @include media-min($xl) {
        padding: 8px 24px 16px;
      }
    }

    &__tab {
      cursor: pointer;

      display: flex;
      align-items: center;
      justify-content: center;

      min-width: fit-content;
      height: 34px;
      padding: 0 16px;

      background: var(--bg-sub-menu);
      border: 1px solid var(--border);
      border-radius: 8px;

      @include css-anim;

      &.is-only-icon {
        flex: 1 0 fit-content;
      }

      &_icon {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;

        width: 24px;
        height: 24px;

        color: var(--primary);
      }

      &_name {
        font-size: var(--main-font-size);
        color: var(--text-color);
        white-space: nowrap;
      }

      @include media-min($md) {
        &:hover {
          background-color: var(--bg-sub-menu);
        }
      }

      &.is-active {
        background-color: var(--primary-active);

        .class-detail__tab {
          &_icon,
          &_name {
            color: var(--text-btn-color);
          }

          &_name {
            display: block;
          }
        }
      }
    }

    &__select {
      padding: 0 16px;
    }

    &__content {
      overflow: hidden;
      display: flex;
      flex: 1 1 100%;
      flex-direction: column;

      width: 100%;
      max-height: 100%;
    }

    &__body {
      overflow: auto;
      flex: 1 1 100%;
      width: 100%;

      &--inner {
        padding: 0 16px;

        @include media-min($xl) {
          padding: 0 24px;
        }
      }
    }

    &__images {
      width: 100%;

      &_item {
        width: calc(100% / 3);
      }
    }
  }
</style>
