<template>
  <content-detail class="class-detail">
    <template #fixed>
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
        <ui-select
          :group-select="false"
          :model-value="currentSelectArchetype"
          :options="currentArchetypes"
          group-label="group"
          group-values="list"
          label="name"
          track-by="url"
        >
          <template #placeholder>
            --- {{ currentClass?.archetypeName }} ---
          </template>

          <template #option="{ option }">
            <span v-if="option.$isLabel">{{ option.$groupLabel.name }}</span>

            <span
              v-else
              @click.left.exact.prevent="goToArchetype(option.url)"
            >{{ option.name }}</span>
          </template>
        </ui-select>
      </div>

      <div
        v-if="tabs.length"
        class="class-detail__tabs"
      >
        <div
          v-for="(tab, tabKey) in tabs"
          :key="tabKey"
          :class="{ 'is-active': currentTab?.name === tab.name, 'is-only-icon': !tab.name }"
          class="class-detail__tab"
          @click.left.exact.prevent="clickTabHandler({ index: tabKey, callback: tab.callback })"
        >
          <div
            v-if="!tab.name"
            class="class-detail__tab_icon"
          >
            <svg-icon :icon="`tab-${tab.type}`" />
          </div>

          <div
            v-else
            class="class-detail__tab_name"
          >
            {{ tab.name }}
          </div>
        </div>
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
          :query-books="providedQueryBooks"
          :store-key="getStoreKey"
          in-tab
        />

        <options-view
          v-else-if="currentTab?.type === 'options'"
          :filter-url="currentTab.url"
          :query-books="providedQueryBooks"
          :store-key="getStoreKey"
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

<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import isArray from 'lodash/isArray';
  import sortBy from 'lodash/sortBy';
  import groupBy from 'lodash/groupBy';
  import { computedInject, resolveUnref } from '@vueuse/core';
  import cloneDeep from 'lodash/cloneDeep';
  import VueEasyLightbox from 'vue-easy-lightbox';
  import {
    computed, nextTick, onBeforeUnmount, onMounted, ref
  } from 'vue';
  import type { RouteLocationNormalizedLoaded } from 'vue-router';
  import {
    onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter
  } from 'vue-router';
  import SectionHeader from '@/components/UI/SectionHeader.vue';
  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
  import UiSelect from '@/components/UI/kit/UiSelect.vue';
  import SpellsView from '@/views/Character/Spells/SpellsView.vue';
  import errorHandler from '@/common/helpers/errorHandler';
  import OptionsView from '@/views/Character/Options/OptionsView.vue';
  import RawContent from '@/components/content/RawContent.vue';
  import ContentDetail from '@/components/content/ContentDetail.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useAxios } from '@/common/composition/useAxios';

  interface IEmit {
    (e: 'scroll-to-active'): void;
    (e: 'scroll-to-last-active', href: RouteLocationNormalizedLoaded['path']): void;
  }

  const emit = defineEmits<IEmit>();

  const route = useRoute();
  const router = useRouter();
  const http = useAxios();

  const { isMobile } = storeToRefs(useUIStore());

  const queryBooks = computedInject('queryBooks', source => source);

  const loading = ref(true);
  const error = ref(false);
  const currentClass = ref(undefined);
  const currentTab = ref(undefined);
  const tabs = ref([]);
  const abortController = ref();

  const gallery = ref<{
    show: boolean;
    index: number | null
  }>({
    show: false,
    index: null
  });

  const classBody = ref<HTMLDivElement>();

  const getStoreKey = computed(() => `${
    currentClass.value.name.eng + currentTab.value.type + currentTab.value.order
  }`.replaceAll(' ', ''));

  const currentArchetypes = computed(() => {
    const getArchetypes = list => sortBy(
      Object.values(groupBy(list, o => o.type.name))
        .map(value => ({
          group: value[0].type,
          list: value.map(el => ({
            name: `${ el.name.rus } [${ el.source.shortName }]`,
            url: el.url
          }))
        })),
      [o => o.group.order]
    );

    return isArray(currentClass.value?.archetypes) && currentClass.value.archetypes.length
      ? getArchetypes(currentClass.value.archetypes)
      : [];
  });

  const currentSelectArchetype = computed(() => {
    let selected;

    for (let i = 0; i < currentArchetypes.value.length && !selected; i++) {
      for (let index = 0; index < currentArchetypes.value[i].list.length && !selected; index++) {
        if (currentArchetypes.value[i].list[index].url === route.path) {
          selected = currentArchetypes.value[i].list[index];
        }
      }
    }

    return selected;
  });

  const getUpdatedClass = classInfo => {
    const updatedClass = cloneDeep(classInfo);

    if (!updatedClass.images || !Array.isArray(updatedClass.images)) {
      updatedClass.images = [];
    }

    if (!updatedClass.images.length && updatedClass.image) {
      updatedClass.images.unshift(updatedClass.image);
    }

    return updatedClass;
  };

  const setTab = index => {
    try {
      loading.value = true;

      currentTab.value = tabs.value[index];
      loading.value = false;

      nextTick(() => {
        if (classBody.value instanceof HTMLDivElement) {
          classBody.value.scroll({
            top: 0
          });
        }
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

  const initTabs = async loadedClass => {
    tabs.value = sortBy(loadedClass.tabs, ['order']);

    if (isArray(loadedClass.images) && loadedClass.images?.length) {
      tabs.value.push({
        type: 'images',
        name: 'Галерея',
        order: tabs.value.length,
        callback: showGallery
      });
    }

    await setTab(0);
  };

  const classInfoQuery = async url => {
    if (abortController.value instanceof AbortController) {
      abortController.value.abort();
    }

    try {
      error.value = false;
      loading.value = true;
      abortController.value = new AbortController();

      const resp = await http.post({
        url,
        payload: {
          filter: {
            book: resolveUnref(queryBooks.value)
          }
        },
        signal: abortController.value.signal
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

  const clickTabHandler = async ({
    index,
    callback
  }) => {
    if (typeof callback === 'function') {
      callback();

      return;
    }

    await setTab(index);
  };

  const goToArchetype = path => {
    router.push({ path });
  };

  const scrollToSection = (hash: string) => {
    if (!hash || !(classBody.value instanceof HTMLDivElement)) {
      return;
    }

    const formattedHash = hash.startsWith('#')
      ? hash
      : `#${ hash }`;

    const section = classBody.value.querySelector(formattedHash);

    if (!section) {
      return;
    }

    if (!route.hash) {
      // const { href } = router.resolve(
      //   {
      //     path: route.path,
      //     hash: formattedHash
      //   },
      //   route
      // );
      //
      // window.history.replaceState({}, '', href);

      router.replace({
        path: route.path,
        hash: formattedHash
      });
    }

    classBody.value.scroll({
      top: section.getBoundingClientRect().top - 119 - 56,
      behavior: 'smooth'
    });
  };

  const anchorClickHandler = e => {
    if (e.button) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const { target } = e;

    const hash = target
      .getAttribute('href')
      .replace('#', '')
      .trim();

    if (hash) {
      scrollToSection(hash);
    }
  };

  const getAnchorLinks = () => {
    if (!(classBody.value instanceof HTMLDivElement)) {
      return [];
    }

    const nodeList = classBody.value.querySelectorAll('[href^="#"]');

    return Array.from(nodeList)
      .filter(link => !!(
        link
          .getAttribute('href')
          .replace('#', '')
          .trim()
      ));
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

<style lang="scss" scoped>
  .class-detail {
    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    &__loader {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      &_img {
        width: 70%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;

        &:before {
          content: '';
          display: block;
          width: 100%;
          padding-bottom: 100%;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          position: absolute;
          filter: drop-shadow(0 0 12px var(--bg-main));
        }
      }
    }

    &__tabs {
      display: flex;
      width: 100%;
      flex-shrink: 0;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 16px;

      @include media-min($xl) {
        padding: 0 24px 16px 24px;
      }
    }

    &__tab {
      @include css_anim();

      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 16px;
      cursor: pointer;
      height: 34px;
      min-width: fit-content;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-sub-menu);

      &.is-only-icon {
        flex: 1 0 fit-content;
      }

      &_icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--primary);
      }

      &_name {
        color: var(--text-color);
        white-space: nowrap;
        font-size: var(--main-font-size);
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
      :deep(.ui-select) {
        .multiselect {
          margin: 0 16px;
          width: auto;

          &__content {
            &-wrapper {
              width: 100%;
              left: 0;
              background-color: var(--bg-sub-menu);
            }
          }

          &__tags,
          &__select {
            border-radius: 0;
          }

          &:hover,
          &:focus-within {
            @include css_anim();

            border-color: var(--border);

            .multiselect {
              &__content {
                &-wrapper {
                  border-color: var(--border);
                }
              }
            }
          }
        }
      }
    }

    &__content {
      width: 100%;
      flex: 1 1 100%;
      max-height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    &__body {
      width: 100%;
      flex: 1 1 100%;
      overflow: auto;

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
