<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import { useBookmarks } from '../composables';
  import { BOOKMARKS_ICON, BOOKMARKS_TEXT } from '../model';

  /**
   * Кнопка закладки для страницы записи. Клик сохраняет в группу по
   * умолчанию; у вошедшего пользователя рядом список его групп.
   */
  const { url, name } = defineProps<{
    url: string;
    name: string;
  }>();

  const toast = useToast();
  const { isSaved, toggle, customGroups, refresh } = useBookmarks();

  const isBusy = ref(false);

  const isSavedInDefault = computed(() => isSaved(url));

  const icon = computed(() =>
    isSavedInDefault.value ? BOOKMARKS_ICON.filled : BOOKMARKS_ICON.outline,
  );

  const label = computed(() =>
    isSavedInDefault.value ? BOOKMARKS_TEXT.remove : BOOKMARKS_TEXT.add,
  );

  /**
   * Переключает закладку в группе.
   * @param groupUUID - группа; без неё — группа по умолчанию
   */
  async function toggleIn(groupUUID?: string) {
    if (isBusy.value) {
      return;
    }

    isBusy.value = true;

    try {
      const isAdded = await toggle(url, name, groupUUID);

      toast.add({
        title: isAdded ? BOOKMARKS_TEXT.added : BOOKMARKS_TEXT.removed,
        icon: isAdded ? BOOKMARKS_ICON.filled : BOOKMARKS_ICON.outline,
      });
    } catch {
      toast.add({ title: BOOKMARKS_TEXT.error, color: 'error' });
    } finally {
      isBusy.value = false;
    }
  }

  function toggleDefault() {
    return toggleIn();
  }

  const groupItems = computed<Array<DropdownMenuItem>>(() =>
    customGroups.value.map((group) => ({
      label: group.name,
      type: 'checkbox',
      checked: isSaved(url, group.uuid),
      onSelect: (event: Event) => {
        event.preventDefault();
        toggleIn(group.uuid);
      },
    })),
  );

  onMounted(() => {
    refresh().catch(() => undefined);
  });
</script>

<template>
  <UFieldGroup>
    <UButton
      :icon="icon"
      :aria-label="label"
      :aria-pressed="isSavedInDefault"
      :loading="isBusy"
      color="neutral"
      variant="ghost"
      @click.left.exact.prevent="toggleDefault"
    />

    <UDropdownMenu
      v-if="groupItems.length"
      :items="groupItems"
    >
      <UButton
        :icon="BOOKMARKS_ICON.more"
        :aria-label="BOOKMARKS_TEXT.groups"
        color="neutral"
        variant="ghost"
      />
    </UDropdownMenu>
  </UFieldGroup>
</template>
