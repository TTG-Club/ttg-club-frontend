import type { VNode } from 'vue';
import { h } from 'vue';
import DiceRoller from '@/components/UI/DiceRoller.vue';
import { SPEED } from '@/types/Markup/base.types';
import UiEasyLightbox from '@/components/UI/kit/UiEasyLightbox.vue';

/* eslint-disable no-use-before-define */
export const useMarkup = (leadingCharacter = '@') => {
    const splitByMarkers = (string: string) => {
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

                    if (char2 === leadingCharacter) {
                        if (tagDepth++ > 0) {
                            curStr += '{';
                        } else {
                            out.push(curStr.replace(/<VE_LEAD>/g, leadingCharacter));
                            curStr = `{${ leadingCharacter }`;
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
                        out.push(curStr.replace(/<VE_LEAD>/g, leadingCharacter));
                        curStr = '';
                    }

                    break;

                case leadingCharacter: {
                    if (!isLastOpen) {
                        curStr += '<VE_LEAD>';
                    } else {
                        curStr += leadingCharacter;
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
            out.push(curStr.replace(/<VE_LEAD>/g, leadingCharacter));
        }

        return out;
    };

    const splitByPipeBase = (string: string) => {
        let tagDepth = 0;
        let char;

        let
            char2;

        const out = [];

        let curStr = '';

        const len = string.length;

        for (let i = 0; i < len; ++i) {
            char = string[i];
            char2 = string[i + 1];

            switch (char) {
                case '{':
                    if (char2 === leadingCharacter) tagDepth++;
                    curStr += '{';

                    break;

                case '}':
                    if (tagDepth) tagDepth--;
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

        if (curStr) out.push(curStr);

        return out.map(item => item.trim());
    };

    const splitFirstSpace = (string: string) => {
        const firstIndex = string.indexOf(' ');

        return firstIndex !== -1
            ? [string.substr(0, firstIndex), string.substr(firstIndex + 1)]
            : [string, ''];
    };

    const convertBold = (entry: string) => h('b', convertString(entry));

    const convertItalic = (entry: string) => h('i', convertString(entry));

    const convertStrike = (entry: string) => h('s', convertString(entry));

    const convertUnderline = (entry: string) => h('u', convertString(entry));

    const convertCode = (entry: string) => h('code', convertString(entry));

    const convertSpeed = (entry: string) => {
        const [speed, type] = splitByPipeBase(entry);

        if (!type) {
            return h('span', `${ speed } фт.`);
        }

        const types = Object.values(SPEED);
        const founded = types.find(item => item.key === type);

        if (!founded) {
            throw new Error(`Неизвестный тип скорости: "${ type }"`);
        }

        return h('span', `${ speed } фт. ${ founded.localized }`);
    };

    const convertStyle = (entry: string) => {
        const [displayText, styles] = splitByPipeBase(entry);
        const classList = (styles || '').split(';');

        return h(
            'span',
            { class: classList },
            convertString(displayText)
        );
    };

    const convertGallery = (entry: string) => {
        const [
            urls,
            preview,
            alt,
            bgHide
        ] = splitByPipeBase(entry);

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

        return h(
            UiEasyLightbox,
            {
                images,
                preview,
                alt,
                useBgHide
            }
        );
    };

    const getValidColor = (color: string, isExtended = false) => {
        if (isExtended) {
            return color.replace(/[^-a-zA-Z\d]/g, '');
        }

        return color.replace(/[^a-fA-F\d]/g, '')
            .slice(0, 8);
    };

    const convertColor = (entry: string) => {
        const [text, colorString] = splitByPipeBase(entry);
        const color = getValidColor(colorString, true);

        return h(
            'span',
            {
                style: {
                    color: color.startsWith('--') ? `var(${ color })` : `#${ color }`
                }
            },
            convertString(text)
        );
    };

    const convertTitle = (marker: string, entry: string) => {
        const level = marker.replace('@title', '');
        const [text, styles] = splitByPipeBase(entry);
        const classList = (styles || '').split(';');

        return h(
            `h${ level }`,
            { class: classList },
            convertString(text)
        );
    };

    const convertDice = (marker: string, text: string) => {
        const [, ...flags] = splitByPipeBase(text);

        return h(DiceRoller, { formula: text });
    };

    const getVNode = (marker: string, text: string) => {
        switch (marker) {
            // Жирный текст
            case '@b':
            case '@bold':
                return convertBold(text);

            // Курсивный текст
            case '@i':
            case '@italic':
                return convertItalic(text);

            // Зачеркнутый текст
            case '@s':
            case '@strike':
                return convertStrike(text);

            // Подчеркнутый текст
            case '@u':
            case '@underline':
                return convertUnderline(text);

            // Элемент с моноширным шрифтом
            case '@code':
                return convertCode(text);

            // Заголовки
            case '@title2':
            case '@title3':
            case '@title4':
            case '@title5':
                return convertTitle(marker, text);

            // Элемент с классами
            case '@style':
                return convertStyle(text);

            // Изменение цвета
            case '@color':
                return convertColor(text);

            // Скорость перемещения
            case '@speed':
                return convertSpeed(text);

            // Галерея
            case '@gallery':
                return convertGallery(text);

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
                return convertDice(marker, text);

            default:
                return h('span', text);
        }
    };

    const convertString = (entry: string) => {
        const tagSplit = splitByMarkers(entry);
        const len = tagSplit.length;
        const result: Array<VNode | string> = [];

        for (let i = 0; i < len; ++i) {
            const str = tagSplit[i];

            if (!str) {
                continue;
            }

            if (str.startsWith(`{${ leadingCharacter }`)) {
                const [marker, text] = splitFirstSpace(str.slice(1, -1));

                result.push(getVNode(marker, text));
            } else {
                result.push(str);
            }
        }

        return result;
    };

    const parse = (entry: string | null) => {
        if (!entry) {
            return h('span', 'Произошла какая-то ошибка...');
        }

        const paragraphs = entry.split('\n\n');

        if (paragraphs.length > 1) {
            return paragraphs.map(str => h('p', convertString(str)));
        }

        return convertString(entry);
    };

    return {
        parse
    };
};
