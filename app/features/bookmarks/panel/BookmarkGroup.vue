<script setup lang="ts">
  import type { BookmarkGroupNode } from '../model';

  import { BOOKMARKS_ICON, BOOKMARKS_TEXT } from '../model';
  import BookmarkLink from './BookmarkLink.vue';

  /**
   * Группа закладок: категории разделов со ссылками. Свои группы вошедшего
   * пользователя можно переименовать и удалить.
   */
  const {
    group,
    isEditable = false,
    isTitleShown = false,
  } = defineProps<{
    group: BookmarkGroupNode;
    isEditable?: boolean;
    isTitleShown?: boolean;
  }>();

  const emit = defineEmits<{
    remove: [uuid: string];
    rename: [name: string];
  }>();

  const isRenaming = ref(false);
  const isConfirmOpen = ref(false);
  const name = ref(group.name);

  function startRename() {
    name.value = group.name;
    isRenaming.value = true;
  }

  function submitRename() {
    const value = name.value.trim();

    isRenaming.value = false;

    if (value && value !== group.name) {
      emit('rename', value);
    }
  }

  function confirmRemove() {
    isConfirmOpen.value = false;
    emit('remove', group.uuid);
  }
</script>

<template>
  <section class="flex flex-col gap-3">
    <header
      v-if="isTitleShown"
      class="flex items-center gap-1"
    >
      <UInput
        v-if="isRenaming"
        v-model="name"
        :aria-label="BOOKMARKS_TEXT.rename"
        size="sm"
        autofocus
        class="flex-auto"
        @keydown.enter.exact.prevent="submitRename"
        @keydown.esc.exact.prevent="isRenaming = false"
        @blur="submitRename"
      />

      <h3
        v-else
        class="flex-auto px-2.5 font-semibold text-highlighted"
      >
        {{ group.name }}
      </h3>

      <template v-if="isEditable && !isRenaming">
        <UButton
          :icon="BOOKMARKS_ICON.edit"
          :aria-label="BOOKMARKS_TEXT.rename"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="startRename"
        />

        <UPopover v-model:open="isConfirmOpen">
          <UButton
            :icon="BOOKMARKS_ICON.delete"
            :aria-label="BOOKMARKS_TEXT.deleteGroup"
            color="neutral"
            variant="ghost"
            size="xs"
          />

          <template #content>
            <div class="flex max-w-60 flex-col gap-3 p-3">
              <p class="text-sm">
                {{ BOOKMARKS_TEXT.deleteGroupConfirm }}
              </p>

              <div class="flex justify-end gap-2">
                <UButton
                  :label="BOOKMARKS_TEXT.cancel"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click.left.exact.prevent="isConfirmOpen = false"
                />

                <UButton
                  :label="BOOKMARKS_TEXT.deleteGroup"
                  color="error"
                  size="sm"
                  @click.left.exact.prevent="confirmRemove"
                />
              </div>
            </div>
          </template>
        </UPopover>
      </template>
    </header>

    <p
      v-if="!group.children.length"
      class="px-2.5 text-sm text-muted"
    >
      {{ BOOKMARKS_TEXT.empty }}
    </p>

    <div
      v-for="category in group.children"
      :key="category.uuid"
      class="flex flex-col gap-0.5"
    >
      <h4 class="px-2.5 text-sm text-muted">
        {{ category.name }}
      </h4>

      <ul class="flex flex-col">
        <BookmarkLink
          v-for="item in category.children"
          :key="item.uuid"
          :item="item"
          @remove="emit('remove', item.uuid)"
        />
      </ul>
    </div>
  </section>
</template>
