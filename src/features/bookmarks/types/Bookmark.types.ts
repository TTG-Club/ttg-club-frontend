export interface IBookmarkItem {
    uuid: string;
    name: string;
    url: string;
    type: string;
    order: number;
    parentUUID: string;
}

export interface IBookmarkCategory {
    uuid: string;
    name: string;
    order: number;
    parentUUID: string;
    children: IBookmarkItem[];
}

export interface IBookmarkGroup {
    uuid: string;
    name: string;
    order: number;
    children: IBookmarkCategory[];
}

export interface IBookmarkItemApi {
    uuid: string;
    name: string;
    url: string;
    type: string;
    order: number;
    parentUUID: string;
}

export interface IBookmarkCategoryApi {
    uuid: string;
    name: string;
    order: number;
    parentUUID: string;
}

export interface IBookmarkGroupApi {
    uuid: string;
    name: string;
    order: number;
}

export type TBookmark = IBookmarkGroupApi | IBookmarkCategoryApi | IBookmarkItemApi

export interface IBookmarkCategoryInfo {
    name: string,
    code: string,
    itemType: string,
    order: number
}
