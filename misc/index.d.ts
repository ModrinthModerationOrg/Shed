declare interface OnChangeCallback<T> {
    (value: T): void;
}

declare class Observable<T> {
    private listeners?: OnChangeCallback<T>[];
    get(): T;
    set(value: T): void;

    static of<T>(startingValue: T): Observable<T>;

    static and(...observables: Observable<boolean>[]): Observable<boolean>;
    static or(...observables: Observable<boolean>[]): Observable<boolean>;

    constructor (getter: () => T, setter: (value: T) => T, runChangeCallbackOnSet?: boolean);

    onChange(callback: OnChangeCallback<T>): this;
}

declare const fallThoughEndec: Endec<any>;

declare interface Settings {
    get(key: string): any;
    set(key: string, value: any): any;
    onMutation(key: string, callback: (key: string, oldValue: any, newValue: any) => void): void
}

declare abstract class Setting<T> extends Observable<T> {
    get key(): string;
    get defaultValue(): T;
    get endec(): Endec<T>;

    constructor (settings: Settings, key: string, defaultValue: T, endec?: Endec<T>);

    static of<T>(settings: Settings, key: string, defaultValue: T, endec?: Endec<T>): Setting<T>;
    static of<T>(settings: Settings, key: string, defaultValue: T, endec?: AsyncEndec<T>): Promise<Setting<T>>;
}

declare class Endec<T> {
    constructor (decode: (value: any) => T, encode: (value: T) => any);
    decode(value: any): T;
    encode(value: T ): object;
}

declare class AsyncEndec<T> {
    constructor (decode: (value: any) => Promise<T>, encode: (value: T) => Promise<any>);
    decode(value: any): Promise<T>;
    encode(value: T ): Promise<object>;
}

class TreeNode<N extends TreeNode<N>> {
    parent: TreeNode<N> | null;
    children: Map<string, N>;
    name: string;
    path: string;

    constructor(parent: TreeNode<N> | null, name: string, path: string);

    sort(compare: ((a: N, b: N) => number) | undefined): this;
}

function getFromCollectionValidated<T>(obj: Collection<T>, key, defaultKey): T;

function getFromCollection<T>(obj: Collection<T>, key: string): T;

function validateKeyWithCollection<T>(obj: Collection<T>, key, defaultKey): T;

function isGeneralAllowedStatusCode(status: number): boolean;

function sleep(ms: number): Promise<void>;

function waitForElementValue(selector: string, getter: (element: Element) => Element, interval?: number): Promise<Element>;