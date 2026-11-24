<script setup lang="ts">
  /**
   * Рамка блока листа.
   *
   * Обводка непрозрачным `border-default`: своей заливки у панели нет, и рамка
   * читается только за счёт контраста с фоном страницы. Приглушённый бордер
   * остаётся у внутренних элементов — там их отделяет ещё и заливка.
   *
   * ВАЖНО: перед `fieldset` в шаблоне не должно быть ничего, даже комментария.
   * Дев-сборка Vue комментарии сохраняет, корень панели становится фрагментом, и
   * `$el` у неё — якорь фрагмента, а не сам элемент. Всё, что достаёт элемент по
   * ссылке на компонент (`onLongPress` здесь и в ресурсах класса,
   * `useElementHover` в плитке характеристики), тогда молча вешается на пустой
   * узел — и ломается только разработка, потому что прод комментарии вырезает.
   */
  const props = defineProps<{
    title?: string;
    /** Короткая подпись: подменяет `title`, когда рамка слишком узкая. */
    shortTitle?: string;
    /** Центрирование заголовка на рамке (для плиток-показателей). */
    centerTitle?: boolean;
    /** Подсветка всего блока при наведении (для кликабельных блоков). */
    interactive?: boolean;
    /** Действия заголовка видны всегда, а не проявляются по наведению. */
    persistentActions?: boolean;
  }>();

  /**
   * Обёртка действий заголовка: колонка грида в потоке легенды. Обводку рамки
   * под действиями разрывает сама легенда, поэтому подложка под значком не
   * нужна — в отличие от прежней абсолютной раскладки, где кнопка стояла прямо
   * на линии рамки и закрывала её собой.
   *
   * Без прав на правку кнопка помечена `invisible` — тогда колонки нет вовсе:
   * раздвигать обводку ради пустого места незачем.
   *
   * Пара пикселей вверх — выравнивание по подписи: значок на 14 пикселях выше
   * её заглавных букв, и по центру строки его тянуло вниз. Сдвиг у обёртки, а
   * не у самой кнопки: `overflow-hidden` внутренней ячейки срезал бы значок,
   * вылезший за её бокс.
   */
  const TITLE_ACTIONS_CLASS =
    '-mt-0.5 inline-grid align-middle transition-[grid-template-columns] duration-200 has-[.invisible]:hidden';

  /**
   * Наведение (или переход с клавиатуры) раздвигает колонку, и в обводке рамки
   * появляется место под кнопку. Схлопнутая колонка (`0fr`) дыры в обводке не
   * оставляет. Ниже `lg` (1024px) колонка раскрыта всегда — тот же порог, что и
   * у остальных кнопок правки листа (см. `SHEET_REVEAL_CONTROL_CLASS`): на узком
   * экране ховера может не быть вовсе.
   */
  const TITLE_ACTIONS_REVEAL_CLASS =
    'grid-cols-[0fr] group-hover/panel:grid-cols-[1fr] focus-within:grid-cols-[1fr] max-lg:grid-cols-[1fr]';

  const titleActionsClass = computed(() =>
    props.persistentActions
      ? `${TITLE_ACTIONS_CLASS} grid-cols-[1fr]`
      : `${TITLE_ACTIONS_CLASS} ${TITLE_ACTIONS_REVEAL_CLASS}`,
  );

  const frameClass = computed(() => [
    props.interactive
      ? 'transition-colors hover:border-primary/60 hover:bg-elevated/40'
      : undefined,

    // Свой @container только с короткой подписью: подпись переключаем по
    // ширине самой рамки, а не всего листа, и не меняем контекст остальным
    // панелям (внутри них есть свои @-утилиты)
    props.shortTitle ? '@container' : undefined,
  ]);

  const legendClass = computed(() =>
    props.centerTitle ? 'mx-auto' : undefined,
  );
</script>

<template>
  <fieldset
    class="group/panel relative flex min-w-0 flex-col gap-3 rounded-lg border border-default px-3 pt-1 pb-3"
    :class="frameClass"
  >
    <!-- Слот заголовка нужен скелетону: там на месте подписи серая плашка,
      а рамка должна остаться той же самой, а не её копией -->
    <legend
      v-if="title || $slots.title"
      class="relative px-2 text-[10px] font-bold tracking-wider text-muted uppercase"
      :class="legendClass"
    >
      <slot name="title" />

      <template v-if="shortTitle">
        <!-- Обе подписи в разметке: полная в узкой плитке переносится на вторую
          строку и разрывает обводку, поэтому короткую показываем только там, где
          полная уже не влезает. Порог мерится по внутренней ширине рамки (так
          работает container-query), а самой длинной подписи листа («Класс
          доспеха») хватает 6.75rem вместе с отбивкой легенды — 7rem даёт запас
          на другой шрифт. Скринридеру название группы читается полностью в
          любом состоянии — из sr-only-дубля -->
        <span class="whitespace-nowrap @max-[7rem]:hidden">{{ title }}</span>

        <span class="@min-[7rem]:hidden">
          <span aria-hidden="true">{{ shortTitle }}</span>

          <span class="sr-only">{{ title }}</span>
        </span>
      </template>

      <template v-else>{{ title }}</template>

      <!-- Действия в потоке легенды: подпись сама разрывает под ними обводку
        рамки. `overflow-hidden` внутренней обёртки обнуляет минимальную ширину
        ячейки — без него `0fr` не схлопнется под содержимое.

        Отбивка перед кнопками — на третьем узле, внутри обрезаемой ячейки.
        На самой ячейке она схлопнуться не может: при `box-sizing: border-box`
        ширина бокса не бывает меньше его отступов, поэтому схлопнутая колонка
        оставляла за подписью 6 невидимых пикселей — и подпись, центрованная по
        рамке (плитки характеристик), стояла не по центру, пока лист доступен
        для правки. `shrink-0` держит кнопки в их ширине, чтобы при разъезде
        колонки они не сжимались, а выезжали из-под обрезки -->
      <span
        v-if="$slots['title-actions']"
        :class="titleActionsClass"
      >
        <span class="flex overflow-hidden">
          <span class="flex shrink-0 items-center gap-1 pl-1.5">
            <slot name="title-actions" />
          </span>
        </span>
      </span>
    </legend>

    <slot />
  </fieldset>
</template>
