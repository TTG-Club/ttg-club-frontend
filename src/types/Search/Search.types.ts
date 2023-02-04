export type TSearchResult = {
    name: string
    section: string
    description?: string
    url: string
    isHomebrew?: boolean
}

export type TSearchResultList = {
    count: number
    list: TSearchResult[]
}
