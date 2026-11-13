<script setup lang="ts">
  import { AuthModal } from '~user/auth-modal';
  import { PROFILE_ICON, PROFILE_TEXT } from '~user/model';
  import { ProfileNavigation, ProfileSidebar } from '~user/profile';

  // Кабинет личный, поисковикам он не нужен
  useSeoMeta({
    title: PROFILE_TEXT.title,
    robots: 'noindex, nofollow',
  });

  const { isLoggedIn, pending, signOut } = useUser();

  const isAuthOpen = ref(false);

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  async function handleSignOut(): Promise<void> {
    await signOut();
  }
</script>

<template>
  <div>
    <h1 class="sr-only">{{ PROFILE_TEXT.title }}</h1>

    <!-- Раскладка как на new.ttg.club: слева пользователь и разделы -->
    <div
      v-if="isLoggedIn"
      class="grid grid-cols-1 items-start gap-8 pb-12 lg:grid-cols-16"
    >
      <div class="flex min-w-0 flex-col gap-6 lg:col-span-5">
        <ProfileSidebar />

        <div class="hidden flex-col gap-2 lg:flex">
          <ProfileNavigation is-full />

          <UButton
            :label="PROFILE_TEXT.signOut"
            :icon="PROFILE_ICON.signOut"
            color="error"
            variant="ghost"
            size="lg"
            @click.left.exact.prevent="handleSignOut"
          />
        </div>
      </div>

      <div class="flex min-w-0 flex-col gap-6 lg:col-span-11">
        <ProfileNavigation class="lg:hidden" />

        <NuxtPage />
      </div>
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
  </div>
</template>
