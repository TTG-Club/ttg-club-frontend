import { h } from 'vue';

import {
  CHALLENGE_RATING,
  DAMAGE_TYPE,
  SPEED
} from '@/shared/compositions/useMarkupRender/types/base.d';
import type { TMarkupHeading } from '@/shared/compositions/useMarkupRender/useHeadingRender';
import { usePluralize } from '@/shared/compositions/usePluralize';
import DetailTooltip from '@/shared/ui/DetailTooltip.vue';
import DiceRoller from '@/shared/ui/DiceRoller.vue';
import UiEasyLightbox from '@/shared/ui/kit/UiEasyLightbox.vue';

import type { VNode } from 'vue';

/* eslint-disable no-use-before-define */

class MarkupRender {
  private leadingCharacter = '@';

  constructor(leadingCharacter?: string) {
    if (leadingCharacter) {
      this.leadingCharacter = leadingCharacter;
    }
  }

  splitByMarkers = (string: string) => {
    let tagDepth = 0;
    let char;

    let char2;

    const out = [];

    let curStr = '';
    let isLastOpen = false;

    const len = string.length;

    for (let i = 0; i < len; ++i) {
      char = string[i];
      char2 = string[i + 1];

      switch (char) {
        case '{':
          isLastOpen = true;

          if (char2 === this.leadingCharacter) {
            if (tagDepth++ > 0) {
              curStr += '{';
            } else {
              out.push(curStr.replace(/<VE_LEAD>/g, this.leadingCharacter));
              curStr = `{${this.leadingCharacter}`;
              ++i;
            }
          } else {
            curStr += '{';
          }

          break;

        case '}':
          isLastOpen = false;
          curStr += '}';

          if (tagDepth !== 0 && --tagDepth === 0) {
            out.push(curStr.replace(/<VE_LEAD>/g, this.leadingCharacter));
            curStr = '';
          }

          break;

        case this.leadingCharacter: {
          if (!isLastOpen) {
            curStr += '<VE_LEAD>';
          } else {
            curStr += this.leadingCharacter;
          }

          break;
        }

        default:
          isLastOpen = false;
          curStr += char;

          break;
      }
    }

    if (curStr) {
      out.push(curStr.replace(/<VE_LEAD>/g, this.leadingCharacter));
    }

    return out;
  };

  splitByPipeBase = (string: string) => {
    let tagDepth = 0;
    let char;

    let char2;

    const out = [];

    let curStr = '';

    const len = string.length;

    for (let i = 0; i < len; ++i) {
      char = string[i];
      char2 = string[i + 1];

      switch (char) {
        case '{':
          if (char2 === this.leadingCharacter) {
            tagDepth++;
          }

          curStr += '{';

          break;

        case '}':
          if (tagDepth) {
            tagDepth--;
          }

          curStr += '}';

          break;

        case '|': {
          if (tagDepth) {
            curStr += '|';
          } else {
            out.push(curStr);
            curStr = '';
          }

          break;
        }

        default: {
          curStr += char;

          break;
        }
      }
    }

    if (curStr) {
      out.push(curStr);
    }

    return out.map(item => item.trim());
  };

  splitFirstSpace = (string: string) => {
    const firstIndex = string.indexOf(' ');

    return firstIndex !== -1
      ? [string.substring(0, firstIndex), string.substring(firstIndex + 1)]
      : [string, ''];
  };

  renderBold = (entry: string) => h('b', this.recursiveRender(entry));

  renderItalic = (entry: string) => h('i', this.recursiveRender(entry));

  renderStrike = (entry: string) => h('s', this.recursiveRender(entry));

  renderUnderline = (entry: string) => h('u', this.recursiveRender(entry));

  renderCode = (entry: string) => h('code', this.recursiveRender(entry));

  renderSpeed = (entry: string) => {
    const [speed, type] = this.splitByPipeBase(entry);

    if (!type) {
      return h('span', `${speed} фт.`);
    }

    const founded = SPEED.find(item => item.key === type);

    if (!founded) {
      throw new Error(`Неизвестный тип скорости: "${type}"`);
    }

    return h('span', `${speed} фт. ${founded.localized}`);
  };

  renderStyle = (entry: string) => {
    const [displayText, styles] = this.splitByPipeBase(entry);
    const classList = (styles || '').split(';');

    return h('span', { class: classList }, this.recursiveRender(displayText));
  };

  renderGallery = (entry: string) => {
    const [urls, preview, alt, bgHide] = this.splitByPipeBase(entry);

    let useBgHide = true;

    const images = urls.split(/\s?;\s?/g);

    switch (bgHide) {
      case 'true':
      case undefined:
        useBgHide = true;

        break;

      case 'false':
        useBgHide = false;

        break;

      default:
        throw new Error('useBgHide должен быть в значении true или false');
    }

    return h(UiEasyLightbox, {
      images,
      preview,
      alt,
      useBgHide
    });
  };

  getValidColor = (color: string, isExtended = false) => {
    if (isExtended) {
      return color.replace(/[^-a-zA-Z\d]/g, '');
    }

    return color.replace(/[^a-fA-F\d]/g, '').slice(0, 8);
  };

  renderColor = (entry: string) => {
    const [text, colorString] = this.splitByPipeBase(entry);
    const color = this.getValidColor(colorString, true);

    return h(
      'span',
      {
        style: {
          color: color.startsWith('--') ? `var(${color})` : `#${color}`
        }
      },
      this.recursiveRender(text)
    );
  };

  renderTitle = (marker: string, entry: string) => {
    const level = marker.replace('@title', '');
    const [text, styles] = this.splitByPipeBase(entry);
    const classList = (styles || '').split(';');

    return h(`h${level}`, { class: classList }, this.recursiveRender(text));
  };

  renderDice = (marker: string, entry: string) => {
    const [, ...flags] = this.splitByPipeBase(entry);

    // eslint-disable-next-line no-console
    console.log(flags);

    return h(DiceRoller, { formula: entry });
  };

  renderChallengeRating = (entry: string) => {
    const ratings = Object.entries(CHALLENGE_RATING).map(([exp, rating]) => ({
      exp,
      rating
    })) as Array<{
      exp: string;
      rating: string;
    }>;

    if (entry === '-1' || !entry) {
      return h('span', '—');
    }

    const current = ratings.find(
      item => item.rating === entry && item.exp !== '0'
    );

    if (!current) {
      throw new Error(`Неизвестный уровень опасности: ${entry}`);
    }

    const { getPlural } = usePluralize();

    if (current.rating !== '0') {
      const expNumber = parseInt(current.exp, 10);

      const plural = getPlural(expNumber, ['опыт', 'опыта', 'опыта']);

      return h(
        'span',
        `${current.rating} (${expNumber.toLocaleString()} ${plural})`
      );
    }

    const expNumber = parseInt(current.exp, 10);

    const plural = getPlural(expNumber, ['опыт', 'опыта', 'опыта']);

    return h(
      'span',
      `${current.rating} (0 или ${expNumber.toLocaleString()} ${plural})`
    );
  };

  renderDamageType = (entry: string) => {
    const [type, toDisplay, colored] = this.splitByPipeBase(entry);

    const damage = DAMAGE_TYPE.find(item => item.key === type);

    if (!damage) {
      throw new Error(`Неизвестный тип урона: ${type}`);
    }

    return h(
      DetailTooltip,
      {
        url: `/screens/${type}`,
        type: 'screen',
        class: {
          'damage-type': true,
          [`is-${type}`]: colored === 'colored'
        }
      },
      {
        default: () => toDisplay || damage.localized
      }
    );
  };

  renderTagVNode = (marker: string, text: string): VNode => {
    switch (marker) {
      // Жирный текст
      case '@b':
      case '@bold':
        return this.renderBold(text);

      // Курсивный текст
      case '@i':
      case '@italic':
        return this.renderItalic(text);

      // Зачеркнутый текст
      case '@s':
      case '@strike':
        return this.renderStrike(text);

      // Подчеркнутый текст
      case '@u':
      case '@underline':
        return this.renderUnderline(text);

      // Элемент с моноширным шрифтом
      case '@code':
        return this.renderCode(text);

      // Заголовки
      case '@title2':
      case '@title3':
      case '@title4':
      case '@title5':
        return this.renderTitle(marker, text);

      // Элемент с классами
      case '@style':
        return this.renderStyle(text);

      // Изменение цвета
      case '@color':
        return this.renderColor(text);

      // Скорость перемещения
      case '@speed':
        return this.renderSpeed(text);

      // Галерея
      case '@gallery':
        return this.renderGallery(text);

      // DiceRoller
      case '@dice':
      case '@damage':
      case '@hit':
      case '@d20':
      case '@chance':
      case '@coinflip':
      case '@recharge':
      case '@ability':
      case '@savingThrow':
      case '@skillCheck':
        return this.renderDice(marker, text);

      case '@challengeRating':
        return this.renderChallengeRating(text);

      case '@damageType':
        return this.renderDamageType(text);

      default:
        return h('span', text);
    }
  };

  recursiveRenderString = (entry: string) => {
    const tagSplit = this.splitByMarkers(entry);
    const len = tagSplit.length;
    const result: Array<VNode | string> = [];

    for (let i = 0; i < len; ++i) {
      const str = tagSplit[i];

      if (!str) {
        continue;
      }

      if (str.startsWith(`{${this.leadingCharacter}`)) {
        const [marker, text] = this.splitFirstSpace(str.slice(1, -1));

        result.push(this.renderTagVNode(marker, text));
      } else {
        result.push(str);
      }
    }

    return result;
  };

  renderTitleObject = (entry: TMarkupHeading) => {
    if (
      entry.level === 2 &&
      entry.collapse &&
      (!(entry.entries instanceof Array) || !entry.entries.length)
    ) {
      throw new Error('Заголовок нельзя сворачивать, если в нем нет "entries"');
    }

    let classList = entry.style;

    const getSplitClasses = (str?: string): string[] =>
      str
        ?.replace(/;/g, ' ')
        .split(/\s/g)
        .map(item => item.trim())
        .filter(item => !!item) || [];

    if (typeof entry.style === 'string') {
      classList = getSplitClasses(entry.style);
    }

    if (entry.style instanceof Array) {
      classList = entry.style
        .flatMap(styleItem => getSplitClasses(styleItem))
        .filter(item => !!item);
    }

    return h('div', { class: 'markup-heading' }, [
      h(`h${entry.level + 2}`, { class: classList }, entry.name),
      h('div', this.recursiveRender(entry.entries))
    ]);
  };

  recursiveRenderObject = (entry: any): VNode | VNode[] => {
    switch (entry.type) {
      case 'heading':
        return this.renderTitleObject(entry);

      default:
        return h('span', 'wtf');
    }
  };

  recursiveRender = (entry: any | any[]) => {
    if (!entry) {
      return h('span', 'Произошла какая-то ошибка...');
    }

    if (entry instanceof Array) {
      const nodes = [];

      for (const entryElement of entry) {
        if (typeof entryElement === 'string') {
          nodes.push(this.recursiveRenderString(entryElement));

          continue;
        }

        nodes.push(this.recursiveRenderObject(entryElement));
      }

      return nodes;
    }

    if (typeof entry === 'string') {
      return this.recursiveRenderString(entry);
    }

    return this.recursiveRenderObject(entry);
  };
}

export const useRender = (leadingCharacter?: string) => {
  const recursiveRender = new MarkupRender(leadingCharacter);

  return {
    recursiveRender
  };
};
