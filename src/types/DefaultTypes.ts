import type { FilterQueryParams } from '@/common/composition/types/filter';

export type ListQuery = {
    page?: number
    limit?: number
    filter?: FilterQueryParams
    search?: {
        exact: boolean
        value: string
    },
    order?: Array<{
        field: string
        direction: 'asc' | 'desc'
    }>
}
