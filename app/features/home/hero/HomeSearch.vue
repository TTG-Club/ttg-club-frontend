<script setup lang="ts">
  import { useSearchHintTypewriter } from './composables';
  import {
    HOME_SEARCH_HINT_PREFIX,
    HOME_SEARCH_HINT_WIDE_QUERY,
    HOME_SEARCH_HINT_WORDS,
    HOME_SEARCH_HINT_WORDS_COMPACT,
    HOME_SEARCH_ICON,
    HOME_SEARCH_PATH,
    HOME_SEARCH_PLACEHOLDER,
    HOME_SEARCH_SHORTCUT,
    HOME_SEARCH_SHORTCUT_KEYS,
    HOME_SEARCH_TYPING_TAGS,
  } from './model';

  const styles = useCssModule();

  // До монтирования ширина экрана неизвестна: сервер и клиент начинают с
  // полного списка, а на телефоне машинка возьмёт короткий со следующего слова
  const isWide = useMediaQuery(HOME_SEARCH_HINT_WIDE_QUERY, {
    ssrWidth: Infinity,
  });

  // На телефоне крутятся только короткие разделы — длинные упираются в край поля
  const hintWords = computed(() =>
    isWide.value ? HOME_SEARCH_HINT_WORDS : HOME_SEARCH_HINT_WORDS_COMPACT,
  );

  const { typed, isIdle } = useSearchHintTypewriter(hintWords);

  /** Курсор мигает только в паузах — на наборе и стирании он горит ровно. */
  const wordClass = computed(() => [
    styles.word,
    isIdle.value ? styles.wordIdle : undefined,
  ]);

  const activeElement = useActiveElement();

  /**
   * Горячая клавиша поиска, как в старом SPA. В полях ввода клавиша печатается
   * как обычно.
   *
   * @param event - нажатие клавиши
   */
  function handleShortcut(event: KeyboardEvent): void {
    if (HOME_SEARCH_TYPING_TAGS.includes(activeElement.value?.tagName ?? '')) {
      return;
    }

    event.preventDefault();

    navigateTo(HOME_SEARCH_PATH, { external: true });
  }

  onKeyStroke(HOME_SEARCH_SHORTCUT_KEYS, handleShortcut);
</script>

<template>
  <!--
    Строка читается как поле поиска, а не кнопка: так понятно, что сюда можно
    печатать. Поиск пока живёт в старом SPA, поэтому строка ведёт на его
    страницу — набор идёт уже там.
  -->
  <a
    :href="HOME_SEARCH_PATH"
    :aria-label="HOME_SEARCH_PLACEHOLDER"
    :class="$style.search"
    class="group relative flex w-full max-w-3xl items-center gap-3 rounded-xl border border-default bg-muted px-4 py-3.5 text-left no-underline transition-colors duration-200 hover:border-primary/60 hover:bg-elevated 2xl:max-w-4xl"
  >
    <!--
      Свет по контуру: кольцо-маска в толщину рамки, а под ним вращается
      квадрат с дугами. Поворот и мерцание браузер ведёт одной композицией, не
      перерисовывая градиент на каждом кадре.
    -->
    <span
      aria-hidden="true"
      :class="$style.glow"
    >
      <span :class="$style.arcs" />
    </span>

    <UIcon
      :name="HOME_SEARCH_ICON"
      class="size-5 shrink-0 text-muted transition-colors duration-200 group-hover:text-primary"
    />

    <!--
      Подсказка живая: «Поиск по» стоит на месте, а раздел за ним машинка
      стирает по букве и печатает следующий. Скринридерам эта чехарда
      бесполезна — им ссылка представляется целой фразой через `aria-label`.
    -->
    <span
      aria-hidden="true"
      :class="$style.hint"
      class="text-muted"
    >
      <span class="me-[0.35em]">{{ HOME_SEARCH_HINT_PREFIX }}</span>

      <span :class="wordClass">{{ typed }}</span>
    </span>

    <kbd
      class="hidden h-5.5 min-w-5.5 shrink-0 items-center justify-center rounded-sm border border-default bg-elevated px-1.5 font-mono text-xs leading-none font-semibold text-highlighted md:inline-flex"
    >
      {{ HOME_SEARCH_SHORTCUT }}
    </kbd>
  </a>
</template>

<style lang="scss" module>
  /* --- Свет по контуру поля ------------------------------------------------
     Светится сама рамка и только она: по контуру бегут дуги основного цвета с
     неравными разрывами, а мерцание идёт по своему графику. Периоды вращения и
     мерцания не кратны друг другу, поэтому вспышки и провалы не выстраиваются
     в заметный цикл и читаются как случайные. Светлые оттенки дуг — основной
     цвет темы, разбавленный светлым, поэтому свет следует за темой. */

  $arcBase: var(--primary);
  $arcMid: color-mix(in srgb, var(--primary) 78%, var(--text-btn-color));
  $arcLight: color-mix(in srgb, var(--primary) 55%, var(--text-btn-color));

  $arcTrack: conic-gradient(
    transparent 0deg,
    $arcBase 14deg,
    $arcLight 34deg,
    $arcBase 54deg,
    transparent 70deg,
    transparent 106deg,
    $arcMid 128deg,
    $arcLight 142deg,
    transparent 178deg,
    transparent 214deg,
    $arcBase 236deg,
    $arcMid 262deg,
    transparent 296deg,
    transparent 324deg,
    $arcMid 342deg,
    transparent 360deg
  );

  /* При системной настройке «меньше движения» дуги стоят на месте и светят
     ровно, вполсилы */
  .glow {
    pointer-events: none;

    position: absolute;

    /* Ровно по рамке: абсолютный слой считает края от внутренней (padding)
       коробки, поэтому -1px возвращает его на край поля, а padding в 1px
       задаёт толщину светящейся нити — ровно как у самой рамки */
    inset: -1px;

    overflow: hidden;

    padding: 1px;
    border-radius: inherit;

    opacity: 0.6;

    mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);

    /* Маска оставляет от дорожки только кольцо в эту толщину — без неё
       градиент залил бы всё поле */
    mask-clip: content-box, border-box;
    mask-composite: exclude;

    transition: filter 0.25s ease;

    @media (prefers-reduced-motion: no-preference) {
      /* Шапка ушла с экрана — свет замирает (`--home-hero-play-state`
         ставит HomeHero) */
      animation: arc-flicker 7.3s ease-in-out infinite
        var(--home-hero-play-state, running);
    }
  }

  .search:hover .glow,
  .search:focus-visible .glow {
    filter: brightness(1.35) saturate(1.1);
  }

  /* Поворот дорожки вокруг центра поля — то же, что сдвиг начального угла
     конического градиента. Квадрат шире поля на 64px, поэтому его сторона
     всегда не меньше диагонали поля и при любом повороте он закрывает рамку
     целиком */
  .arcs {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    aspect-ratio: 1;
    width: calc(100% + 64px);

    background: $arcTrack;

    @media (prefers-reduced-motion: no-preference) {
      animation: arc-travel 9s linear infinite
        var(--home-hero-play-state, running);
    }
  }

  /* Строка изолирована (`contain: strict`) и её высота задана явно: машинка
     меняет текст по букве, и без изоляции браузер на каждой букве заново
     раскладывал всю страницу. Подсказка длиннее поля не рубится «в лоб»:
     правый край растворяется */
  .hint {
    contain: strict;
    overflow: hidden;
    flex: 1 1 auto;

    min-width: 0;
    height: 20px;

    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;

    mask-image: linear-gradient(
      to right,
      #000 calc(100% - 0.75rem),
      transparent
    );

    @media (width >= 576px) {
      height: 24px;
      font-size: 16px;
      line-height: 24px;
    }
  }

  .word {
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
      border-radius: 999px;

      vertical-align: -0.15em;

      background: var(--primary);
    }
  }

  /* В паузах курсор мигает, на наборе и стирании горит ровно — как в
     терминале */
  .wordIdle::after {
    @media (prefers-reduced-motion: no-preference) {
      animation: caret-blink 1.2s ease-in-out infinite;
    }
  }

  @keyframes arc-travel {
    to {
      rotate: 360deg;
    }
  }

  /* Неровные ключи — источник «случайности»: свет то вспыхивает, то почти
     гаснет, оставляя от рамки её обычную линию */
  @keyframes arc-flicker {
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

  @keyframes caret-blink {
    0%,
    46% {
      opacity: 1;
    }

    54%,
    100% {
      opacity: 0.15;
    }
  }
</style>
