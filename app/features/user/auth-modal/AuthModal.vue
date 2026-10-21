<script setup lang="ts">
  import { SIGN_IN_FORM } from '../model';
  import { SignInForm } from './ui';

  const isOpened = defineModel<boolean>({ default: false });

  function close() {
    isOpened.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpened"
    :title="SIGN_IN_FORM.title"
    :ui="{ content: 'max-w-sm' }"
  >
    <template #content>
      <div class="relative p-8">
        <SignInForm @close="close" />

        <UButton
          :aria-label="SIGN_IN_FORM.closeLabel"
          class="absolute top-3 right-3"
          icon="tabler:x"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />
      </div>
    </template>
  </UModal>
</template>
