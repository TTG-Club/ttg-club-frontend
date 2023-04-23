export interface IBookmarkGroup {
    uuid: string;
    name: string;
    order: number;
}

export interface IBookmarkCategory extends IBookmarkGroup {
    parentUUID: string;
}

export interface IBookmarkItem extends IBookmarkCategory {
    url: string;
    type?: string;
}

export type TBookmark = IBookmarkGroup | IBookmarkCategory | IBookmarkItem

export interface IBookmarkCategoryInfo {
    name: string,
    code: string,
    itemType: string,
    order: number
}

export type TWithChildren<T, C> = T & {
    children: Array<C>
}

export type TQueryAddBookmark = Pick<TBookmark, 'name'> & Partial<TBookmark>
