<script setup lang="ts">
  import type { HomePromoCardContent } from '../model';

  import { useHomeLink } from '../composables';
  import { HOME_LINK_ARROW_ICON } from '../model';
  import HomeEyebrow from './HomeEyebrow.vue';

  const {
    card,
    compact = false,
    muted = false,
  } = defineProps<{
    card: HomePromoCardContent;
    /** Низкая карточка — для тех, где под заголовком нет описания */
    compact?: boolean;
    /**
     * Картинка обесцвечена, как фактуры плиты разделов, и набирает цвет
     * только под курсором
     */
    muted?: boolean;
  }>();

  const { isExternalLink } = useHomeLink();

  const isExternal = computed(() => isExternalLink(card.to, card.external));

  // В новой вкладке открываются только другие сайты; разделы старого SPA —
  // в этой же
  const target = computed(() => (card.external ? '_blank' : undefined));

  const heightClass = computed(() => (compact ? 'min-h-28' : 'min-h-44'));

  // Те же фильтры, что у фактур плиты разделов: brightness сбивает пересветы
  // обесцвеченной картинки
  const imageClass = computed(() =>
    muted
      ? 'grayscale brightness-85 group-hover:grayscale-0 group-hover:brightness-100'
      : undefined,
  );
</script>

<template>
  <!--
    Текст карточки выстроен в столбец и прижат к низу: карточки стоят и в узких
    колонках, где подпись справа от заголовка пришлось бы ломать по слогам.
    Подпись лежит на тёмной картинке во всех темах, поэтому цвет текста
    фиксированный светлый, а не тема-зависимый.
  -->
  <NuxtLink
    :to="card.to"
    :external="isExternal"
    :target
    class="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-default bg-muted p-4 no-underline transition-[border-color,box-shadow] duration-300 hover:border-primary/45 hover:shadow-legacy"
    :class="heightClass"
  >
    <img
      :src="card.image"
      alt=""
      aria-hidden="true"
      loading="lazy"
      class="pointer-events-none absolute inset-0 size-full object-cover opacity-85 transition-[transform,filter] duration-500 select-none group-hover:scale-105"
      :class="imageClass"
    />

    <span
      :class="$style.overlay"
      class="pointer-events-none absolute inset-0"
    />

    <span class="relative z-1 flex flex-col items-start gap-2">
      <HomeEyebrow
        :label="card.eyebrow"
        accent
      />

      <span class="text-2xl leading-none font-bold text-on-image">
        {{ card.title }}
      </span>

      <span
        v-if="card.description"
        class="text-sm leading-snug text-on-image/70"
      >
        {{ card.description }}
      </span>

      <span
        v-if="card.linkLabel"
        class="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-link"
      >
        {{ card.linkLabel }}

        <UIcon
          :name="HOME_LINK_ARROW_ICON"
          class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </span>
    </span>
  </NuxtLink>
</template>

<style lang="scss" module>
  /* Затемнение под подписью: градиент палитры, у Tailwind для него утилиты нет */
  .overlay {
    background: var(--bg-image-overlay);
  }
</style>
