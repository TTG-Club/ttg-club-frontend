export type Maybe<T> = T | undefined;

export type WithChildren<T, C> = T & {
    children: Array<C>
}
