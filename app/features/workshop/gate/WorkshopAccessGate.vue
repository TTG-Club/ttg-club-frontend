<script setup lang="ts">
  import { AuthModal } from '~user/auth-modal';

  import { WORKSHOP_ICON, WORKSHOP_TEXT } from '../model';

  /**
   * Пускает в мастерскую только модераторов и администраторов: гостю
   * предлагает войти, остальным говорит, что доступа нет.
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
    :icon="WORKSHOP_ICON.forbidden"
    :title="WORKSHOP_TEXT.forbiddenTitle"
    :description="WORKSHOP_TEXT.forbiddenDescription"
    variant="naked"
  />

  <template v-else>
    <UEmpty
      :icon="WORKSHOP_ICON.guest"
      :title="WORKSHOP_TEXT.guestTitle"
      :description="WORKSHOP_TEXT.guestDescription"
      variant="naked"
    >
      <template #actions>
        <UButton
          :label="WORKSHOP_TEXT.signIn"
          :loading="pending"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </UEmpty>

    <AuthModal v-model="isAuthOpen" />
  </template>
</template>
