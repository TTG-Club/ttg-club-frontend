export type TClassSource = {
    name: string
    shortName: string
    homebrew?: boolean
}

export type TClassName = {
    rus: string
    eng: string
}

export type TClassGroup = {
    name: string
    order: number
}

export type TClassArchetype = {
    name: TClassName
    type: TClassGroup
    source: TClassSource
    url: string
}

export type TClassLink = {
    archetypeName?: string
    archetypes: Array<TClassArchetype>
    dice: 'к6' | 'к8' | 'к10' | 'к12'
    icon?: string
    image: string
    name: TClassName
    sidekick: boolean
    source: TClassSource
    url: string
    group?: TClassGroup
}

export type TClassArchetypeList = {
    list: Array<TClassArchetype>
    group?: TClassGroup
}

export type TClassItem = Omit<TClassLink, 'archetypes'> & {
    archetypes: Array<TClassArchetypeList>
}

export type TClassList = {
    list: Array<TClassItem>
    group?: TClassGroup
}
