<script setup lang="ts">
  import { useAppBreakpoints } from '@/shared/composable/useAppBreakpoints';
  import { useNavPopover } from '@/shared/composable/useNavPopover';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import { useSearchHintTypewriter } from './composable';
  import {
    HOME_SEARCH_HINT_PREFIX,
    HOME_SEARCH_HINT_WORDS,
    HOME_SEARCH_HINT_WORDS_COMPACT,
    HOME_SEARCH_ICON,
    HOME_SEARCH_PLACEHOLDER,
    HOME_SEARCH_SHORTCUT,
  } from './model';

  const { openSearch } = useNavPopover();

  const isCompact = useAppBreakpoints().smaller('sm');

  // На телефоне крутятся только короткие разделы — длинные упираются в край поля
  const hintWords = computed(() =>
    isCompact.value ? HOME_SEARCH_HINT_WORDS_COMPACT : HOME_SEARCH_HINT_WORDS,
  );

  const { typed, isIdle } = useSearchHintTypewriter(hintWords);

  /** Курсор мигает только в паузах — на наборе и стирании он горит ровно. */
  const wordClasses = computed(() => [
    'home-search__word',
    { 'home-search__word_idle': isIdle.value },
  ]);
</script>

<template>
  <!--
    Поле поиска, а не кнопка: так строка читается как то, во что можно
    печатать. Клик и горячая клавиша всё так же открывают окно поиска — набор
    идёт уже в нём.
  -->
  <button
    type="button"
    class="home-search"
    :aria-label="HOME_SEARCH_PLACEHOLDER"
    @click.left.exact.prevent="openSearch"
  >
    <svg-icon
      :icon="HOME_SEARCH_ICON"
      :size="20"
      class="home-search__icon"
    />

    <!--
      Подсказка живая: «Поиск по» стоит на месте, а раздел за ним машинка
      стирает по букве и печатает следующий. Скринридерам эта чехарда
      бесполезна — им кнопка представляется целой фразой через `aria-label`.
    -->
    <span
      class="home-search__hint"
      aria-hidden="true"
    >
      <span class="home-search__prefix">{{ HOME_SEARCH_HINT_PREFIX }}</span>

      <span :class="wordClasses">{{ typed }}</span>
    </span>

    <kbd class="home-search__kbd">{{ HOME_SEARCH_SHORTCUT }}</kbd>
  </button>
</template>

<style lang="scss" scoped>
  /* --- Свет по контуру поля ------------------------------------------------
     Светится сама рамка и только она: по контуру бегут дуги основного цвета с
     неравными разрывами, а мерцание идёт по своему графику. Периоды вращения и
     мерцания не кратны друг другу, поэтому вспышки и провалы не выстраиваются
     в заметный цикл и читаются как случайные. Светлые оттенки дуг — основной
     цвет темы, разбавленный светлым, поэтому свет следует за темой. */

  $arc-base: var(--primary);
  $arc-mid: color-mix(in srgb, var(--primary) 78%, var(--text-btn-color));
  $arc-light: color-mix(in srgb, var(--primary) 55%, var(--text-btn-color));

  $arc-track: conic-gradient(
    from var(--home-search-arc-angle),
    transparent 0deg,
    $arc-base 14deg,
    $arc-light 34deg,
    $arc-base 54deg,
    transparent 70deg,
    transparent 106deg,
    $arc-mid 128deg,
    $arc-light 142deg,
    transparent 178deg,
    transparent 214deg,
    $arc-base 236deg,
    $arc-mid 262deg,
    transparent 296deg,
    transparent 324deg,
    $arc-mid 342deg,
    transparent 360deg
  );

  .home-search {
    cursor: pointer;

    position: relative;

    display: flex;
    gap: 12px;
    align-items: center;

    width: 100%;
    max-width: 768px;
    padding: 14px 16px;

    text-align: left;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;

    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;

    &::before {
      pointer-events: none;
      content: '';

      position: absolute;
      /* Ровно по рамке: абсолютный слой считает края от внутренней (padding)
         коробки, поэтому -1px возвращает его на край поля, а padding в 1px
         задаёт толщину светящейся нити — ровно как у самой рамки. */
      inset: -1px;

      padding: 1px;

      background: $arc-track;
      border-radius: inherit;

      transition: filter 0.25s ease;
      animation:
        home-search-arc-travel 9s linear infinite,
        home-search-arc-flicker 7.3s ease-in-out infinite;

      /* Маска оставляет от дорожки только кольцо в эту толщину — без неё
         градиент залил бы всё поле. Префиксы вручную: автопрефиксера в сборке
         нет, а старые Chromium и Safari понимают маски только с -webkit-. */
      -webkit-mask-clip: content-box, border-box;
      mask-clip: content-box, border-box;
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      -webkit-mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
      mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
    }

    &:hover {
      background-color: var(--bg-sub-menu);
      border-color: color-mix(in srgb, var(--primary) 60%, transparent);

      .home-search__icon {
        color: var(--primary);
      }
    }

    &:hover::before,
    &:focus-visible::before {
      filter: brightness(1.35) saturate(1.1);
    }

    @include media-min($xxl) {
      max-width: 896px;
    }

    &__icon {
      flex-shrink: 0;
      color: var(--text-g-color);
      transition: color 0.2s ease;
    }

    /* --- Строка-машинка ---------------------------------------------------- */

    &__hint {
      overflow: hidden;
      flex: 1 1 auto;

      min-width: 0;

      font-size: 14px;
      line-height: 20px;
      color: var(--text-g-color);
      white-space: nowrap;

      /* Подсказка длиннее поля не рубится «в лоб»: правый край растворяется.
         Полоска растворения узкая (12px) — у самого длинного раздела на
         телефоне остаётся запас шире неё, поэтому обычную строку она не
         трогает. */
      -webkit-mask-image: linear-gradient(
        to right,
        #000 calc(100% - 0.75rem),
        transparent
      );
      mask-image: linear-gradient(
        to right,
        #000 calc(100% - 0.75rem),
        transparent
      );

      @include media-min($sm) {
        font-size: 16px;
        line-height: 24px;
      }
    }

    &__prefix {
      margin-inline-end: 0.35em;
    }

    &__word {
      color: var(--text-color);

      /* Пробел внутри раздела и хвост при наборе не схлопываются */
      white-space: pre;

      /* Курсор набора — часть слова, поэтому едет вместе с ним по букве */
      &::after {
        content: '';

        display: inline-block;

        width: 2px;
        height: 1.05em;
        margin-inline-start: 0.16em;

        vertical-align: -0.15em;

        background: var(--primary);
        border-radius: 999px;
      }

      /* В паузах курсор мигает, на наборе и стирании горит ровно — как в
         терминале */
      &_idle::after {
        animation: home-search-caret-blink 1.2s ease-in-out infinite;
      }
    }

    &__kbd {
      display: none;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      min-width: 22px;
      height: 22px;
      padding: 0 6px;

      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      color: var(--text-color-title);

      background-color: var(--bg-sub-menu);
      border: 1px solid var(--border);
      border-radius: 4px;

      @include media-min($md) {
        display: inline-flex;
      }
    }
  }

  @property --home-search-arc-angle {
    inherits: false;
    initial-value: 0deg;
    syntax: '<angle>';
  }

  @keyframes home-search-arc-travel {
    0% {
      --home-search-arc-angle: 0deg;
    }

    100% {
      --home-search-arc-angle: 360deg;
    }
  }

  /* Неровные ключи — источник «случайности»: свет то вспыхивает, то почти
     гаснет, оставляя от рамки её обычную линию. */
  @keyframes home-search-arc-flicker {
    0% {
      opacity: 0.25;
    }

    9% {
      opacity: 0.9;
    }

    16% {
      opacity: 0.35;
    }

    27% {
      opacity: 1;
    }

    35% {
      opacity: 0.15;
    }

    44% {
      opacity: 0.75;
    }

    58% {
      opacity: 0.2;
    }

    67% {
      opacity: 0.95;
    }

    79% {
      opacity: 0.3;
    }

    88% {
      opacity: 0.7;
    }

    100% {
      opacity: 0.25;
    }
  }

  @keyframes home-search-caret-blink {
    0%,
    46% {
      opacity: 1;
    }

    54%,
    100% {
      opacity: 0.15;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .home-search::before {
      opacity: 0.6;
      animation: none;
    }

    .home-search__word_idle::after {
      animation: none;
    }
  }
</style>
