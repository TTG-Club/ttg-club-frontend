<script setup lang="ts">
  /**
   * Раздел внутри записи формы: заголовок и содержимое на «дорожке» — линии,
   * идущей от значка свёртки вниз вдоль всего содержимого.
   *
   * Перенос `EditorNestedSection` нового сайта (`~ui/editor`): на старом сайте
   * его нет, а список эффектов, вложенный в чужую запись, рисуется именно им.
   * Пока курсор внутри, дорожка подсвечена — вместе с дорожками разделов выше.
   */
  const {
    title,
    hint = undefined,
    count = 0,
    addLabel = undefined,
    collapsible = true,
  } = defineProps<{
    /** Заголовок раздела. */
    title: string;

    /** Пояснение к разделу по наведению на значок в шапке. */
    hint?: string;

    /** Сколько записей в разделе; ноль — бейдж не показывается. */
    count?: number;

    /** Подпись кнопки добавления в шапке; пусто — кнопки нет. */
    addLabel?: string;

    /** Раздел сворачивается. Выключено — содержимое всегда на виду. */
    collapsible?: boolean;
  }>();

  const emit = defineEmits<{ add: [] }>();

  const { isDesktop } = useDevice();

  /**
   * Подпись раздела одна на обе шапки — сворачиваемую (кнопкой) и обычную.
   * Через переиспользуемый шаблон, а не копией.
   */
  const [DefineTitle, ReuseTitle] = createReusableTemplate();

  /** Дорожка раздела: линия слева и отступ содержимого от неё. */
  const RAIL_CLASS =
    'ml-2 flex flex-col gap-2 border-l-2 border-default pl-2 transition-colors group-focus-within/section:border-primary/60 sm:pl-3';

  /** Общая раскладка шапки: подпись занимает строку, кнопки жмутся вправо. */
  const HEADING_CLASS = 'flex min-w-0 flex-1 items-center gap-2 text-left';

  /**
   * Шапка сворачиваемого раздела — она же кнопка свёртки: нажатие ловит
   * накладка во всю строку, а не один значок.
   */
  const TRIGGER_CLASS = `${HEADING_CLASS} cursor-pointer before:absolute before:inset-0`;

  const isOpen = ref(false);

  /** Значок свёртки: указывает, куда уедет содержимое раздела. */
  const toggleIcon = computed(() =>
    isOpen.value ? 'tabler:chevron-down' : 'tabler:chevron-right',
  );

  /** Подсказка в шапке открывается наведением на компьютере и нажатием на телефоне. */
  const hintMode = computed(() => (isDesktop ? 'hover' : 'click'));

  /** Разворачивает или сворачивает раздел. */
  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  /** Добавление раскрывает раздел: иначе новая запись легла бы в свёрнутый. */
  function add(): void {
    isOpen.value = true;

    emit('add');
  }
</script>

<template>
  <section class="group/section col-span-full flex flex-col gap-2">
    <DefineTitle>
      <UIcon
        v-if="collapsible"
        :name="toggleIcon"
        class="size-4 shrink-0 text-dimmed transition-colors group-focus-within/section:text-primary"
      />

      <span
        v-else
        class="size-4 shrink-0"
        aria-hidden="true"
      />

      <span
        class="min-w-0 truncate text-sm font-medium text-muted transition-colors group-focus-within/section:text-highlighted"
      >
        {{ title }}
      </span>

      <UBadge
        v-if="count"
        size="sm"
        color="primary"
        variant="subtle"
        class="shrink-0 tabular-nums"
      >
        {{ count }}
      </UBadge>
    </DefineTitle>

    <div class="relative flex min-h-7 items-center gap-2">
      <button
        v-if="collapsible"
        type="button"
        :class="TRIGGER_CLASS"
        :aria-expanded="isOpen"
        @click.left.exact.prevent="toggle"
      >
        <ReuseTitle />
      </button>

      <div
        v-else
        :class="HEADING_CLASS"
      >
        <ReuseTitle />
      </div>

      <UPopover
        v-if="hint"
        :mode="hintMode"
        :ui="{ content: 'max-w-80 p-2 text-sm' }"
      >
        <UIcon
          name="tabler:info-circle-filled"
          class="relative shrink-0 cursor-help text-dimmed"
        />

        <template #content>
          {{ hint }}
        </template>
      </UPopover>

      <slot name="actions">
        <UButton
          v-if="addLabel"
          icon="tabler:plus"
          :label="addLabel"
          color="primary"
          variant="soft"
          size="xs"
          class="relative shrink-0"
          @click.left.exact.prevent="add"
        />
      </slot>
    </div>

    <UCollapsible
      v-if="collapsible"
      v-model:open="isOpen"
    >
      <template #content>
        <div :class="RAIL_CLASS">
          <slot />
        </div>
      </template>
    </UCollapsible>

    <div
      v-else
      :class="RAIL_CLASS"
    >
      <slot />
    </div>
  </section>
</template>
