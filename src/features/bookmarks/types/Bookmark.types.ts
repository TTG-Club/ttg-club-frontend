export interface IBookmark {
    uuid: string;
    name: string;
    url?: string;
    type?: string;
    order: number;
    parentUUID?: string;
}
