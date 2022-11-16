export type TName = {
    rus: string;
    eng: string;
}

export type TSource = {
    shortName: string;
    name: string;
    homebrew?: boolean;
}

export type TBestiaryLink = {
    name: TName;
    type: string;
    challengeRating: string;
    url: string;
    source: TSource;
}
