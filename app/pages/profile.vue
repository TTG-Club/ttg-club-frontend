<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { AuthModal } from '~user/auth-modal';
  import { PROFILE_ICON, PROFILE_TEXT } from '~user/model';
  import { ProfileNavigation } from '~user/profile';

  definePageMeta({ layout: 'section' });

  // Кабинет личный, поисковикам он не нужен
  useSeoMeta({
    title: PROFILE_TEXT.title,
    robots: 'noindex, nofollow',
  });

  const { user, isLoggedIn, pending, signOut } = useUser();

  const isAuthOpen = ref(false);

  // Без отображаемого имени на сайте показывается логин
  const shownName = computed(
    () => user.value?.displayName || user.value?.username || '',
  );

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  async function handleSignOut(): Promise<void> {
    await signOut();
  }
</script>

<template>
  <SectionLayout :title="PROFILE_TEXT.title">
    <template
      v-if="isLoggedIn"
      #controls
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col">
          <span class="truncate font-semibold text-highlighted">
            {{ shownName }}
          </span>

          <span class="truncate text-sm text-muted">
            {{ user?.username }}
          </span>
        </div>

        <ProfileNavigation />

        <UButton
          :label="PROFILE_TEXT.signOut"
          :icon="PROFILE_ICON.signOut"
          color="error"
          variant="subtle"
          class="hidden lg:flex"
          block
          @click.left.exact.prevent="handleSignOut"
        />
      </div>
    </template>

    <div
      v-if="isLoggedIn"
      class="flex max-w-3xl flex-col gap-4"
    >
      <NuxtPage />
    </div>

    <UEmpty
      v-else
      :icon="PROFILE_ICON.guest"
      :title="PROFILE_TEXT.guestTitle"
      :description="PROFILE_TEXT.guestDescription"
      variant="naked"
    >
      <template #actions>
        <UButton
          :label="PROFILE_TEXT.signIn"
          :loading="pending"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </UEmpty>

    <AuthModal v-model="isAuthOpen" />
  </SectionLayout>
</template>
