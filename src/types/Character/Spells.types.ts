import type {
    TClassBadge, TName, TRaceBadge, TSource, TSubclassBadge
} from '@/types/Shared/BaseApiFields.types';

export enum SpellsFilterDefaults {
    dbName = 'spells',
    url = '/filters/spells'
}

export type TSpellLinkComponents = {
    v?: boolean;
    s?: boolean;
    m?: boolean;
}

export type TSpellItemComponents = {
    v?: boolean;
    s?: boolean;
    m?: string;
}

export type TSpellLink = {
    name: TName;
    level: number;
    school: string;
    additionalType?: string;
    components: TSpellLinkComponents;
    url: string;
    source: TSource;
    concentration?: boolean;
    ritual?: boolean;
}

export type TSpellItem = {
    name: TName;
    level: number;
    school: string;
    additionalType?: string;
    components: TSpellItemComponents;
    url: string;
    source: TSource;
    range: string;
    duration: string;
    time: string;
    classes: TClassBadge[];
    subclasses?: TSubclassBadge[];
    description: string;
    concentration?: boolean;
    ritual?: boolean;
    races?: TRaceBadge[];
    upper?: string;
}
