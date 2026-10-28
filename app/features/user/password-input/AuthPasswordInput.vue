<script setup lang="ts">
  import { AUTH_ICON, SIGN_IN_FORM } from '../model';

  /** Поле пароля с кнопкой «показать». */
  const {
    placeholder,
    icon = AUTH_ICON.password,
    autocomplete = 'current-password',
    size = 'lg',
  } = defineProps<{
    placeholder: string;
    icon?: string;
    autocomplete?: 'current-password' | 'new-password';
    /** Окна входа крупнее, поля в карточках — обычного размера. */
    size?: 'md' | 'lg';
  }>();

  const password = defineModel<string>({ required: true });

  const isVisible = ref(false);

  const type = computed(() => (isVisible.value ? 'text' : 'password'));

  const toggleIcon = computed(() =>
    isVisible.value ? AUTH_ICON.hide : AUTH_ICON.show,
  );

  const toggleLabel = computed(() =>
    isVisible.value
      ? SIGN_IN_FORM.hidePasswordLabel
      : SIGN_IN_FORM.showPasswordLabel,
  );

  function toggle(): void {
    isVisible.value = !isVisible.value;
  }
</script>

<template>
  <UInput
    v-model="password"
    :type="type"
    :placeholder="placeholder"
    :icon="icon"
    :autocomplete="autocomplete"
    :ui="{ trailing: 'pe-1' }"
    :size="size"
    class="w-full"
    autocapitalize="off"
    autocorrect="off"
  >
    <template #trailing>
      <UButton
        :icon="toggleIcon"
        :aria-label="toggleLabel"
        :aria-pressed="isVisible"
        color="neutral"
        variant="link"
        size="sm"
        @click.left.exact.prevent="toggle"
      />
    </template>
  </UInput>
</template>
