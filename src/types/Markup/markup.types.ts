export type TMarkupSection = {
    type: 'section';

    name: string;

    entries: any[];
}

export type TMarkupQuote = {
    type: 'quote';

    by: string;

    from: string;

    entries: any[];
}

export type TMarkupListItem = {
    type: 'item';

    name: string;

    entry?: string;

    entries?: any[];
}

export type TMarkupList = {
    type: 'list';

    columns?: number;

    style?: string;

    name?: string;

    items: any[];
}

export type TMarkupInset = {
    type: 'inset';

    name?: string;

    entries: any[];
}

export type TMarkupInsetReadaloud = {
    type: 'insetReadaloud';

    name?: string;

    entries: any[];
}

export type TMarkupEntries = {
    type: 'entries';

    name?: string;

    entries: any[];
}

export type TMarkupInline = {
    type: 'inline';

    entries: any[];
}

export type TMarkupLinkHrefInternal = {
    type: 'internal'
    path: string
}

export type TMarkupLinkHrefExternal = {
    type: 'external'
    url: string
}

export type TMarkupLink = {
    type: 'link';

    text: string;

    href: TMarkupLinkHrefInternal | TMarkupLinkHrefExternal;
}

export type TMarkupInlineBlock = {
    type: 'inlineBlock';

    entries: any[];
}

export type TMarkupOptions = {
    type: 'options';

    entries: any[];
}

export type TMarkupTable = {
    type: 'table';

    caption?: string;

    footnotes?: string[];

    colLabels: string[];

    colStyles?: string[];

    rows: any[][];
}

export type TMarkupTableRow = {
    type: 'row';

    style?: string;

    row: any[];
}

export type TMarkupTableRoll = {
    min?: number;

    max?: number;

    exact?: number;

    pad?: boolean;
}

export type TMarkupTableCell = {
    type: 'cell';

    roll: TMarkupTableRoll;
}

export type TMarkupBonus = {
    type: 'bonus';

    value: number;
}

export type TMarkupBonusSpeed = {
    type: 'bonusSpeed';

    value: number;
}

export type TMarkupDiceToRoll = {
    numbers: number;

    faces: number;

    modifier?: number;

    hideModifier?: boolean;
}

export type TMarkupDice = {
    type: 'dice';

    toRoll: TMarkupDiceToRoll[];

    rollable: boolean;
}

export type TMarkupAbilitiesShorthand = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type TMarkupAbilityDc = {
    type: 'abilityDc';

    name: string;

    attributes: TMarkupAbilitiesShorthand[];
}

export type TMarkupAbilityAttackMod = {
    type: 'abilityAttackMod';

    name: string;

    attributes: TMarkupAbilitiesShorthand[];
}

export type TMarkupAbilityGeneric = {
    type: 'abilityGeneric';

    name?: string;

    text: string;

    attributes?: TMarkupAbilitiesShorthand[];
}

export type TMarkupOptFeature = {
    type: 'optfeature'
    name?: string
    prerequisite?: string
    entries?: any[]
}

export type TMarkupVariant = {
    type: 'variant'
    name: string
    entries: any[]
}

export type TMarkupVariantSub = {
    type: 'variantSub'
    name: string
    entries: any[]
}

export type TMarkupImage = {
    type: 'image'
    href: TMarkupLinkHrefExternal | TMarkupLinkHrefInternal
    title?: string
}

export type TMarkupHp = {
    average: number;
    formula: string;
}

export type TMarkupSpeed = {
    walk?: number
    fly?: number
    burrow?: number
    climb?: number
    swim?: number
}

export type TMarkupLegendaryGroup = {
    name: string
    source: string
}

export type TMarkupSpellCasting = {
    name: string
    headerEntries: string[]
    will: string[]
    daily: {
        [cooldown: `${ number }e`]: string[]
    }
    ability: TMarkupAbilitiesShorthand
}

export type TMarkupAbilities = {
    [ability in TMarkupAbilitiesShorthand]: number;
};

export type TMarkupMonsterStatBlock = TMarkupAbilities & {
    name: string;
    size: 'L'[];
    type: string;
    source: string;
    alignment: string[];
    ac: number[];
    hp: TMarkupHp;
    immune: string[];
    conditionImmune: string[];
    senses: string[];
    passive: number;
    languages: string[];
    cr: string;
    trait: TMarkupEntries[];
    action: TMarkupEntries[];
    legendaryGroup: TMarkupLegendaryGroup;
    legendary: TMarkupEntries[];
    page: number;
    spellcasting: TMarkupSpellCasting[];
    environment: string[];
    soundClip: TMarkupLinkHrefInternal | TMarkupLinkHrefExternal;
    traitTags: string[];
    actionTags: string[];
}

export type TMarkupMonster = {
    dataType: 'monster'
    data: TMarkupMonsterStatBlock
};

export type TMarkupStatBlockInline = {
    type: 'statblockInline'
    collapsed?: boolean
    style?: string
    dataType: string
    data: any
}
