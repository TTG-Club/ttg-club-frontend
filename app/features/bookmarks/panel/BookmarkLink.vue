<script setup lang="ts">
  import type { BookmarkItem } from '../model';

  import { isKnownRoute } from '~content/model';

  import { BOOKMARKS_ICON, BOOKMARKS_TEXT } from '../model';

  /** Ссылка в закладках с кнопкой удаления. */
  const { item } = defineProps<{
    item: BookmarkItem;
  }>();

  const emit = defineEmits<{
    remove: [];
  }>();

  const router = useRouter();

  // Разделы, которых ещё нет в Nuxt, отдаёт старое SPA.
  const isExternal = computed(
    () =>
      !isKnownRoute(
        item.url,
        router.getRoutes().map((route) => route.path),
      ),
  );
</script>

<template>
  <li class="group flex items-center gap-1">
    <NuxtLink
      :to="item.url"
      :external="isExternal"
      class="min-w-0 flex-auto truncate rounded-md px-2.5 py-1.5 hover:bg-elevated"
      active-class="text-primary"
    >
      {{ item.name }}
    </NuxtLink>

    <UButton
      :icon="BOOKMARKS_ICON.remove"
      :aria-label="`${BOOKMARKS_TEXT.removeItem}: ${item.name}`"
      color="neutral"
      variant="ghost"
      size="xs"
      class="opacity-60 group-hover:opacity-100"
      @click.left.exact.prevent="emit('remove')"
    />
  </li>
</template>
