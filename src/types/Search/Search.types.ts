import type { TVuePaginateProps } from '@svifty7/vue-paginate/types/VuePaginate';

export type TSearchResult = {
    name: string
    section: string
    url: string
}

export type TSearchResultList = {
    count: number
    list: TSearchResult[]
}
