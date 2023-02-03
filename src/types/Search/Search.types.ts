export type TSearchResult = {
    name: string
    section: string
    description?: string
    url: string
}

export type TSearchResultList = {
    count: number
    list: TSearchResult[]
}
