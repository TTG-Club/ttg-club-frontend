<script setup lang="ts">
  /**
   * Список однотипных блоков формы: заголовок с кнопкой добавления и сами
   * блоки. Пустой список не занимает места: пометка стоит рядом с заголовком.
   */
  const {
    title,
    description = undefined,
    addLabel,
    addIcon,
    isAddDisabled = false,
    isEmpty,
    emptyText,
  } = defineProps<{
    title: string;
    /** Пояснение под заголовком. */
    description?: string;
    addLabel: string;
    addIcon: string;
    isAddDisabled?: boolean;
    isEmpty: boolean;
    emptyText: string;
  }>();

  const emit = defineEmits<{
    add: [];
  }>();

  defineSlots<{
    default?: () => unknown;
  }>();

  function handleAdd(): void {
    emit('add');
  }
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div class="flex min-w-0 flex-col">
        <h3
          class="flex items-baseline gap-2 text-base font-semibold text-highlighted"
        >
          {{ title }}

          <span
            v-if="isEmpty"
            class="text-sm font-normal text-muted"
          >
            {{ emptyText }}
          </span>
        </h3>

        <p
          v-if="description"
          class="text-sm text-muted"
        >
          {{ description }}
        </p>
      </div>

      <UButton
        :label="addLabel"
        :icon="addIcon"
        :disabled="isAddDisabled"
        color="neutral"
        variant="soft"
        size="sm"
        @click.left.exact.prevent="handleAdd"
      />
    </div>

    <slot v-if="!isEmpty" />
  </section>
</template>
