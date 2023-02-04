export type TSearchResult = {
    name: string
    section: string
    description?: string
    url: string
    homebrew?: boolean
}

export type TSearchResultList = {
    count: number
    list: TSearchResult[]
}
