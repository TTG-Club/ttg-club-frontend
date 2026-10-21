<script setup lang="ts">
  import { SidebarPopover } from '~infrastructure/sidebar/popover';

  import { useBookmarks } from '../composables';
  import { BOOKMARKS_ICON, BOOKMARKS_TEXT, DEFAULT_GROUP } from '../model';
  import BookmarkGroup from './BookmarkGroup.vue';

  /** Кнопка закладок в боковой панели и список закладок во всплывающей панели. */
  const toast = useToast();

  const { tree, count, isLoggedIn, refresh, remove, rename, createGroup } =
    useBookmarks();

  const isOpened = ref(false);
  const isLoading = ref(false);
  const isFailed = ref(false);
  const newGroupName = ref('');

  const icon = computed(() =>
    count.value ? BOOKMARKS_ICON.filled : BOOKMARKS_ICON.outline,
  );

  const isEmpty = computed(() => !count.value && !isLoggedIn.value);

  async function load() {
    isLoading.value = true;
    isFailed.value = false;

    try {
      await refresh();
    } catch {
      isFailed.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Выполняет действие с закладками и сообщает об ошибке.
   * @param action - действие
   */
  async function run(action: () => Promise<void>) {
    try {
      await action();
    } catch {
      toast.add({ title: BOOKMARKS_TEXT.error, color: 'error' });
    }
  }

  function removeEntry(uuid: string) {
    return run(() => remove(uuid));
  }

  function renameGroup(uuid: string, name: string) {
    const group = tree.value.find((item) => item.uuid === uuid);

    if (group) {
      return run(() => rename(group, name));
    }

    return undefined;
  }

  function addGroup() {
    const name = newGroupName.value.trim();

    if (!name) {
      return undefined;
    }

    newGroupName.value = '';

    return run(() => createGroup(name));
  }

  function isDefault(order: number) {
    return order === DEFAULT_GROUP.order;
  }

  onMounted(load);

  watch(isLoggedIn, load);
</script>

<template>
  <SidebarPopover v-model="isOpened">
    <template #trigger="{ toggle }">
      <UButton
        :icon="icon"
        :aria-label="BOOKMARKS_TEXT.title"
        color="neutral"
        variant="ghost"
        size="xl"
        @click.left.exact.prevent="toggle"
      />
    </template>

    <template #default>
      <div class="w-80 max-w-[calc(100vw-2rem)]">
        <header class="px-4 pt-4 pb-2 text-lg font-semibold text-highlighted">
          {{ BOOKMARKS_TEXT.title }}
        </header>

        <div class="flex flex-col gap-5 px-2 pb-4">
          <div
            v-if="isLoading && !tree.length"
            class="flex flex-col gap-2 px-2"
          >
            <USkeleton
              v-for="index in 5"
              :key="index"
              class="h-5 w-4/5"
            />
          </div>

          <p
            v-else-if="isFailed"
            class="px-2.5 text-muted"
          >
            {{ BOOKMARKS_TEXT.loadError }}
          </p>

          <p
            v-else-if="isEmpty"
            class="px-2.5 text-muted"
          >
            {{ BOOKMARKS_TEXT.empty }}
          </p>

          <template v-else>
            <BookmarkGroup
              v-for="group in tree"
              :key="group.uuid"
              :group="group"
              :is-title-shown="isLoggedIn"
              :is-editable="isLoggedIn && !isDefault(group.order)"
              @remove="removeEntry"
              @rename="renameGroup(group.uuid, $event)"
            />
          </template>

          <form
            v-if="isLoggedIn"
            class="flex gap-2 px-2"
            @submit.prevent="addGroup"
          >
            <UInput
              v-model="newGroupName"
              :placeholder="BOOKMARKS_TEXT.newGroup"
              :aria-label="BOOKMARKS_TEXT.newGroup"
              size="sm"
              class="flex-auto"
            />

            <UButton
              :icon="BOOKMARKS_ICON.add"
              :aria-label="BOOKMARKS_TEXT.addGroup"
              type="submit"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </form>

          <p
            v-else
            class="px-2.5 text-sm text-muted"
          >
            {{ BOOKMARKS_TEXT.guestHint }}
          </p>
        </div>
      </div>
    </template>
  </SidebarPopover>
</template>
