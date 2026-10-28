<script setup lang="ts">
  import { BUG_REPORT_ICON, BUG_REPORT_TEXT } from '../../model';

  /** Кто отправляет репорт; гостю подсказка войти. */
  const { user, isLoggedIn } = useUser();

  const authorName = computed(
    () =>
      user.value?.displayName
      || user.value?.username
      || BUG_REPORT_TEXT.anonymous,
  );

  const authorIcon = computed(() =>
    isLoggedIn.value ? BUG_REPORT_ICON.author : BUG_REPORT_ICON.anonymous,
  );
</script>

<template>
  <div class="flex flex-col gap-1">
    <p class="flex items-center gap-2 text-sm text-highlighted">
      <UIcon
        :name="authorIcon"
        class="size-5 shrink-0"
      />

      <span>
        {{ BUG_REPORT_TEXT.author }}: <strong>{{ authorName }}</strong>
      </span>
    </p>

    <p
      v-if="!isLoggedIn"
      class="pl-7 text-xs text-muted"
    >
      {{ BUG_REPORT_TEXT.signInHint }}
    </p>
  </div>
</template>
