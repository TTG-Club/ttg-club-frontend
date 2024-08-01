<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import CustomBookmarkGroup from '@/features/bookmarks/components/CustomBookmarks/CustomBookmarkGroup.vue';
  import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';

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
      order: customBookmarkStore.getGroupBookmarks.length,
    });

    disableGroupCreating();
  };

  const scrollToTop = () => {
    wrapper.value?.scroll({
      top: 0,
      behavior: 'smooth',
    });
  };

  const toggleAll = () => {
    customBookmarkStore.toggleAll();
  };

  onBeforeMount(() => {
    customBookmarkStore.restoreOpenedGroupsFromSession();
  });
</script>

<template>
  <div class="bookmarks">
    <div class="bookmarks__header">
      <div class="bookmarks__info">
        <span class="bookmarks__info--title"
          >Закладки <sup class="beta">β</sup>
        </span>
      </div>

      <n-flex size="small">
        <transition
          name="fade"
          mode="out-in"
        >
          <n-button
            v-if="isShowScrollBtn"
            quaternary
            @click.left.prevent="scrollToTop"
          >
            <template #icon>
              <svg-icon icon="arrow/up" />
            </template>
          </n-button>
        </transition>

        <n-button
          quaternary
          @click.left.prevent="toggleAll"
        >
          <template #icon>
            <svg-icon
              :icon="`expand/${isAllGroupsOpened ? 'exit' : 'enter'}`"
            />
          </template>
        </n-button>

        <n-tooltip>
          <template #trigger>
            <n-button
              :quaternary="!isEdit"
              :default="isEdit"
              :type="isEdit ? 'primary' : 'default'"
              @click.left.prevent="isEdit = !isEdit"
            >
              <template #icon>
                <svg-icon icon="edit" />
              </template>
            </n-button>
          </template>

          <template #default> Перейти в режим редактирования </template>
        </n-tooltip>
      </n-flex>
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
          <n-input
            v-model:value="newGroupName"
            autofocus
            placeholder="Название группы"
            @keyup.enter.exact.prevent="createGroup"
          />

          <n-button
            quaternary
            @click.left.exact.prevent="createGroup"
          >
            <template #icon>
              <svg-icon icon="check" />
            </template>
          </n-button>

          <n-button
            quaternary
            @click.left.exact.prevent="disableGroupCreating"
          >
            <template #icon>
              <svg-icon icon="close" />
            </template>
          </n-button>
        </div>

        <n-button
          v-else
          class="bookmarks__new"
          quaternary
          block
          @click.left.exact.prevent="enableGroupCreating"
        >
          <template #icon>
            <svg-icon icon="plus" />
          </template>

          <template #default> Добавить группу </template>
        </n-button>
      </div>
    </div>
  </div>
</template>
