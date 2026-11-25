<script setup lang="ts">
  import { PROFILE_ROUTE } from '~user/model';

  import { SHEET_LIMIT_TEXT, SHEET_SHARE_ICON } from '../model';

  /**
   * Подсказка на достигнутом лимите: что сделать сейчас и, если подписка
   * расширяет лимит, ссылка на неё.
   */
  const { hint, upsell = '' } = defineProps<{
    /** Что сделать, чтобы освободить место. */
    hint: string;
    /** Что даёт подписка; пусто — лимит уже расширен или расширять нечем. */
    upsell?: string;
  }>();

  const subscriptionRoute = `${PROFILE_ROUTE}/subscription`;
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
    <span>{{ hint }}</span>

    <span
      v-if="upsell"
      class="flex items-center gap-1"
    >
      {{ upsell }}

      <UButton
        :to="subscriptionRoute"
        :label="SHEET_LIMIT_TEXT.subscription"
        :icon="SHEET_SHARE_ICON.subscription"
        color="primary"
        variant="link"
        size="xs"
        class="p-0"
      />
    </span>
  </div>
</template>
