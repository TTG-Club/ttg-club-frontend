<script setup lang="ts">
  import { MECHANICS_ICON } from '../model';

  /**
   * Блок редактора механики: заголовок со счётчиком и кнопкой добавления,
   * содержимое под спойлером. Свёрнут по умолчанию — у большинства записей
   * механики нет, и развёрнутые разом блоки растягивали бы форму на экраны.
   * Порт `EditorNestedSection` нового сайта без всплывающих подсказок: здесь
   * пояснение стоит строкой под заголовком.
   */
  const {
    title,
    hint = undefined,
    count = 0,
    addLabel = undefined,
  } = defineProps<{
    title: string;
    /** Пояснение под заголовком раскрытого блока. */
    hint?: string;
    /** Сколько заполнено; ноль — бейдж не показывается. */
    count?: number;
    /** Подпись кнопки добавления в шапке; пусто — кнопки нет. */
    addLabel?: string;
  }>();

  const emit = defineEmits<{
    add: [];
  }>();

  defineSlots<{
    default?: () => unknown;
  }>();

  const isOpen = ref(false);

  const toggleIcon = computed(() =>
    isOpen.value ? MECHANICS_ICON.collapse : MECHANICS_ICON.expand,
  );

  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  /** Добавление раскрывает блок: иначе новая строка легла бы в свёрнутый. */
  function add(): void {
    isOpen.value = true;
    emit('add');
  }
</script>

<template>
  <section class="group/block col-span-full flex flex-col gap-2">
    <div class="relative flex min-h-7 items-center gap-2">
      <button
        type="button"
        class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left before:absolute before:inset-0"
        :aria-expanded="isOpen"
        @click.left.exact.prevent="toggle"
      >
        <UIcon
          :name="toggleIcon"
          class="size-4 shrink-0 text-dimmed transition-colors group-focus-within/block:text-primary"
        />

        <span
          class="min-w-0 truncate text-sm font-medium text-muted transition-colors group-focus-within/block:text-highlighted"
        >
          {{ title }}
        </span>

        <UBadge
          v-if="count"
          :label="String(count)"
          size="sm"
          color="primary"
          variant="subtle"
          class="shrink-0 tabular-nums"
        />
      </button>

      <UButton
        v-if="addLabel"
        :icon="MECHANICS_ICON.add"
        :label="addLabel"
        color="primary"
        variant="soft"
        size="xs"
        class="relative shrink-0"
        @click.left.exact.prevent="add"
      />
    </div>

    <div
      v-if="isOpen"
      class="ml-2 flex flex-col gap-3 border-l-2 border-default pl-2 transition-colors group-focus-within/block:border-primary/60 sm:pl-3"
    >
      <p
        v-if="hint"
        class="text-xs text-muted"
      >
        {{ hint }}
      </p>

      <slot />
    </div>
  </section>
</template>
