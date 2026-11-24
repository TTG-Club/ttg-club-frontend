<script setup lang="ts">
  import { AuthModal } from '~user/auth-modal';

  import { SHEET_ICON, SHEET_TEXT } from '../model';

  /**
   * Пока лист в работе, пускает к нему только модераторов и администраторов:
   * гостю предлагает войти, остальным говорит, что лист пока закрыт.
   */
  const { isLoggedIn, isEditor, pending } = useUser();

  const isAuthOpen = ref(false);

  function openAuth(): void {
    isAuthOpen.value = true;
  }
</script>

<template>
  <slot v-if="isEditor" />

  <UEmpty
    v-else-if="isLoggedIn"
    :icon="SHEET_ICON.accessForbidden"
    :title="SHEET_TEXT.accessTitle"
    :description="SHEET_TEXT.accessForbiddenDescription"
    variant="naked"
  />

  <template v-else>
    <UEmpty
      :icon="SHEET_ICON.accessGuest"
      :title="SHEET_TEXT.accessTitle"
      :description="SHEET_TEXT.accessGuestDescription"
      variant="naked"
    >
      <template #actions>
        <UButton
          :label="SHEET_TEXT.accessSignIn"
          :loading="pending"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </UEmpty>

    <AuthModal v-model="isAuthOpen" />
  </template>
</template>
