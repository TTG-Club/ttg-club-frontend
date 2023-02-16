import type { VNode } from 'vue';
import { h } from 'vue';
import DiceRoller from '@/components/UI/DiceRoller.vue';

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

    const splitFirstSpace = (string: string) => {
        const firstIndex = string.indexOf(' ');

        return firstIndex !== -1
            ? [string.substr(0, firstIndex), string.substr(firstIndex + 1)]
            : [string, ''];
    };

    const getVNode = (marker: string, text: string | VNode | Array<VNode | string>) => {
        switch (marker) {
            case '@b':
            case '@bold':
                return h('b', text);

            case '@i':
            case '@italic':
                return h('i', text);

            case '@s':
            case '@strike':
                return h('s', text);

            case '@u':
            case '@underline':
                return h('u', text);

            case '@dice':
                if (typeof text !== 'string') {
                    throw new Error('DiceRoller can\'t contain another VNode');
                }

                return h(DiceRoller, { formula: text });

            default:
                return h('span', text);
        }
    };

    const getString = (entry: string) => {
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

                if (text.match(new RegExp(`{${ leadingCharacter }`, 'gmi'))) {
                    result.push(getVNode(marker, getString(text)));

                    continue;
                }

                result.push(getVNode(marker, text));
            } else {
                result.push(str);
            }
        }

        return result;
    };

    const getConverted = ({
        entry = null,
        entries = null
    }: {
        entry: any | null
        entries: any[] | null
    }) => {
        if (entries instanceof Array) {
            return entries.map(item => h('p', getString(item)));
        }

        return h('p', getString(entry));
    };

    return {
        getConverted
    };
};
