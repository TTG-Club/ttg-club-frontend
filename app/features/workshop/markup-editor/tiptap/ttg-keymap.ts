import { Extension } from '@tiptap/core';

import { LINE_BREAK_MARKER } from './constants';

/**
 * Клавиатурные привязки редактора разметки.
 *
 * Shift+Enter — мягкий перенос строки внутри абзаца. Вставляем его как РОДНОЙ
 * маркер {@br} (инлайн-чип, рендерится переносом строки), а НЕ как
 * Markdown-hardBreak, который сериализуется в «  \n» (одиночный перенос
 * строки) — на нём падает бэкенд-десериализатор описания (он разбивает только
 * по пустой строке \n\n).
 * {@br} же безопасно проходит round-trip через систему {@...}. На сенсорной
 * клавиатуре сочетания нет — там тот же маркер вставляет кнопка тулбара.
 *
 * Mod+E гасим: марку `code` @nuxt/ui добавляет к UEditor безусловно (отключить
 * её пропом нельзя), а сериализуется она в бэктики, которых разметка не знает —
 * они вышли бы на страницу текстом.
 */
export const TtgKeymap = Extension.create({
  name: 'ttgKeymap',

  addKeyboardShortcuts() {
    return {
      'Shift-Enter': () =>
        this.editor.commands.insertContent({
          type: 'ttgMarker',
          attrs: { raw: LINE_BREAK_MARKER },
        }),
      'Mod-e': () => true,
    };
  },
});
