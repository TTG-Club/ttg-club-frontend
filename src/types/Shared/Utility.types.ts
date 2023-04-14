export type Maybe<T> = T | undefined;

export type AnyObject = Record<string, unknown>;

export type AnyArray = any[];

export type RecordKey = string | symbol | number;

export type WithProperty<K extends RecordKey, V> = {
    [k in K]: V;
}
