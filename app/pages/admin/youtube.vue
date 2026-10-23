<script setup lang="ts">
  import {
    ADMIN_YOUTUBE_ICON,
    ADMIN_YOUTUBE_TEXT,
    YOUTUBE_ACTIVE_LIMIT,
    YOUTUBE_PAGE_SIZES,
  } from '~admin/model';
  import { useAdminYoutube } from '~admin/youtube/composables';
  import { YoutubeAddModal, YoutubeVideoCard } from '~admin/youtube/ui';
  import { SectionLayout } from '~section/layout';
  import { AuthModal } from '~user/auth-modal';

  definePageMeta({ layout: 'section' });

  // Служебная страница, поисковикам она не нужна
  useSeoMeta({
    title: ADMIN_YOUTUBE_TEXT.title,
    robots: 'noindex, nofollow',
  });

  const { isLoggedIn, isEditor, pending } = useUser();

  const {
    page,
    pageSize,
    videos,
    total,
    pageCount,
    activeCount,
    isLoading,
    loadError,
    load,
    canToggle,
    toggleActive,
    remove,
    isBusy,
  } = useAdminYoutube();

  const isAuthOpen = ref(false);
  const isAddOpen = ref(false);

  const activeCountText = computed(
    () =>
      `${ADMIN_YOUTUBE_TEXT.activeCount}: ${activeCount.value} ${ADMIN_YOUTUBE_TEXT.activeCountSeparator} ${YOUTUBE_ACTIVE_LIMIT}`,
  );

  const isEmpty = computed(
    () => !isLoading.value && !loadError.value && !videos.value.length,
  );

  const hasPagination = computed(() => pageCount.value > 1);

  // Список читается только в браузере и только редактором: вошли в нужный
  // аккаунт прямо на странице — подгружаем сразу
  onMounted(() => {
    watch(
      isEditor,
      (value) => {
        if (value) {
          void load();
        }
      },
      { immediate: true },
    );
  });

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  function openAdd(): void {
    isAddOpen.value = true;
  }

  async function handleReload(): Promise<void> {
    await load();
  }
</script>

<template>
  <SectionLayout :title="ADMIN_YOUTUBE_TEXT.title">
    <template
      v-if="isEditor"
      #controls
    >
      <div class="flex flex-col gap-3">
        <p class="text-sm text-muted">
          {{ ADMIN_YOUTUBE_TEXT.description }}
        </p>

        <UFormField :label="ADMIN_YOUTUBE_TEXT.pageSize">
          <USelect
            v-model="pageSize"
            :items="YOUTUBE_PAGE_SIZES"
            class="w-full"
          />
        </UFormField>

        <UBadge
          :label="activeCountText"
          :icon="ADMIN_YOUTUBE_ICON.page"
          color="neutral"
          variant="subtle"
          size="lg"
        />

        <UButton
          :label="ADMIN_YOUTUBE_TEXT.add"
          :icon="ADMIN_YOUTUBE_ICON.add"
          block
          @click.left.exact.prevent="openAdd"
        />
      </div>
    </template>

    <div
      v-if="isEditor"
      class="flex flex-col gap-4"
    >
      <UEmpty
        v-if="loadError"
        :icon="ADMIN_YOUTUBE_ICON.error"
        :title="ADMIN_YOUTUBE_TEXT.loadError"
        variant="naked"
      >
        <template #actions>
          <UButton
            :label="ADMIN_YOUTUBE_TEXT.retry"
            :loading="isLoading"
            @click.left.exact.prevent="handleReload"
          />
        </template>
      </UEmpty>

      <UEmpty
        v-else-if="isEmpty"
        :icon="ADMIN_YOUTUBE_ICON.empty"
        :title="ADMIN_YOUTUBE_TEXT.empty"
        variant="naked"
      />

      <template v-else>
        <div
          class="grid grid-cols-1 gap-4 transition-opacity md:grid-cols-2 2xl:grid-cols-3"
          :class="{ 'opacity-60': isLoading }"
        >
          <YoutubeVideoCard
            v-for="video in videos"
            :key="video.id"
            :video="video"
            :can-toggle="canToggle(video)"
            :is-busy="isBusy(video.id)"
            @toggle-active="toggleActive(video, $event)"
            @remove="remove(video)"
            @saved="handleReload"
          />
        </div>

        <UPagination
          v-if="hasPagination"
          v-model:page="page"
          :total="total"
          :items-per-page="pageSize"
          class="self-center"
        />
      </template>

      <YoutubeAddModal
        v-model:open="isAddOpen"
        @added="handleReload"
      />
    </div>

    <UEmpty
      v-else-if="isLoggedIn"
      :icon="ADMIN_YOUTUBE_ICON.forbidden"
      :title="ADMIN_YOUTUBE_TEXT.forbiddenTitle"
      :description="ADMIN_YOUTUBE_TEXT.forbiddenDescription"
      variant="naked"
    />

    <UEmpty
      v-else
      :icon="ADMIN_YOUTUBE_ICON.guest"
      :title="ADMIN_YOUTUBE_TEXT.guestTitle"
      :description="ADMIN_YOUTUBE_TEXT.guestDescription"
      variant="naked"
    >
      <template #actions>
        <UButton
          :label="ADMIN_YOUTUBE_TEXT.signIn"
          :loading="pending"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </UEmpty>

    <AuthModal v-model="isAuthOpen" />
  </SectionLayout>
</template>
