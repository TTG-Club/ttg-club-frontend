<template>
  <div class="bookmarks">
    <div class="bookmarks__header">
      <div class="bookmarks__info">
        <span class="bookmarks__info--title"
          >Закладки <sup class="beta">β</sup>
        </span>
      </div>

      <transition
        name="fade"
        mode="out-in"
      >
        <ui-button
          v-if="isShowScrollBtn"
          icon="arrow/up"
          size="sm"
          type="text"
          color="text"
          class="bookmarks__to-top"
          @click.left.prevent="scrollToTop"
        />
      </transition>

      <ui-button
        :icon="`expand/${isAllGroupsOpened ? 'exit' : 'enter'}`"
        size="sm"
        type="text"
        color="text"
        class="bookmarks__toggle-all"
        @click.left.prevent="toggleAll"
      />

      <ui-button
        v-tippy="{ content: 'Перейти в режим редактирования' }"
        :type="!isEdit ? 'text' : 'default'"
        :color="!isEdit ? 'text' : 'primary'"
        icon="edit"
        size="sm"
        @click.left.exact.prevent="isEdit = !isEdit"
      />

      <label
        v-if="false"
        class="bookmarks__search"
      >
        <span class="bookmarks__search--icon">
          <svg-icon icon="search" />
        </span>
      </label>
    </div>

    <div
      ref="wrapper"
      class="bookmarks__wrapper"
    >
      <div class="bookmarks__body">
        <custom-bookmark-group
          v-for="(group, groupKey) in bookmarks"
          :key="group.uuid + groupKey"
          :group="group"
          :is-edit="isEdit"
          :is-first="!groupKey"
        />

        <div
          v-if="isGroupCreating"
          class="bookmarks__input"
        >
          <ui-input
            v-model="newGroupName"
            autofocus
            placeholder="Название группы"
            @keyup.enter.exact.prevent="createGroup"
          />

          <ui-button
            icon="check"
            size="sm"
            type="text"
            @click.left.exact.prevent="createGroup"
          />

          <ui-button
            icon="close"
            size="sm"
            type="text"
            @click.left.exact.prevent="disableGroupCreating"
          />
        </div>

        <ui-button
          v-else
          class="bookmarks__new"
          size="sm"
          icon="plus"
          type="text"
          @click.left.exact.prevent="enableGroupCreating"
        >
          Добавить группу
        </ui-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount, ref } from 'vue';

  import CustomBookmarkGroup from '@/features/bookmarks/components/CustomBookmarks/CustomBookmarkGroup.vue';
  import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';

  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
  import UiButton from '@/components/UI/kit/button/UiButton.vue';
  import UiInput from '@/components/UI/kit/UiInput.vue';

  const customBookmarkStore = useCustomBookmarkStore();
  const bookmarks = computed(() => customBookmarkStore.getGroupBookmarks);
  const isEdit = ref(false);
  const isGroupCreating = ref(false);
  const newGroupName = ref('');
  const wrapper = ref<HTMLDivElement>();
  const { isAllGroupsOpened } = storeToRefs(customBookmarkStore);

  const isShowScrollBtn = computed(() => {
    if (!wrapper.value) {
      return false;
    }

    return wrapper.value?.scrollTop > 15;
  });

  const enableGroupCreating = () => {
    isGroupCreating.value = true;
    newGroupName.value = '';
  };

  const disableGroupCreating = () => {
    isGroupCreating.value = false;
    newGroupName.value = '';
  };

  const createGroup = async () => {
    await customBookmarkStore.queryAddBookmark({
      name: newGroupName.value,
      order: customBookmarkStore.getGroupBookmarks.length
    });

    disableGroupCreating();
  };

  const scrollToTop = () => {
    wrapper.value?.scroll({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleAll = () => {
    customBookmarkStore.toggleAll();
  };

  onBeforeMount(() => {
    customBookmarkStore.restoreOpenedGroupsFromSession();
  });
</script>
