/// <reference path="./tamper_monkey.d.ts" />
/// <reference path="../misc/index.js" />
//import { GMXMLRequest, DataType } from './tamper_monkey';

declare enum ErrorType {
    ERROR = "error",
    ABORT = "abort",
    TIMEOUT = "timeout",
    INVALID_STATUS = "invalid_status",
    HANDLER_ERROR = "handler_error",
}
declare interface XMLResponseType {
    readonly ARRAYBUFFER: DataType<ArrayBuffer>;
    readonly TEXT: DataType<string>;
    readonly JSON: DataType<Record<string, any>>;
    readonly BLOB: DataType<Blob>;
    readonly STREAM: DataType<any>; // TODO: FIGURE OUT WHAT TYPE THIS IS 
} 

declare type RequestErrorHandler<T> = ((error: GMXMLRequest<T> | null, type: ErrorType, thrownError?: Error) => T);

declare interface MonkeyRequestData<T> extends BaseMonkeyRequestData<T> {
    /** 
     * The method request type either being GET, POST, PATCH, or DELETE 
     */
    method: string;
    /** 
     * The request body for any PATCH/POST requests
     */
    data?: string | Blob | File | Object | Array<any> | FormData | undefined;
}

declare interface BaseMonkeyRequestData<T> {
    /** 
     * Type of data that a given server should Responded in typically from {@link XMLResponseType}'s
     */
    type?: DataType<T>;
    /** 
     * Check if the given returned status is within the valid range for the response from the server which is defaulted to {@link generalStatusCodeRange}
     */
    allowedStatuses?: (status: number) => boolean ,
    /** 
     * Header information for the request
     */
    headers?: { [key: string]: string };
    /** 
     * Handler function used to return the final value for the servers request if required
     */
    handler?: (request: GMXMLRequest<T>) => T;
    /** 
     * Function to handle errors of either caused by the handling of the response or from the request call 
     */
    onError: RequestErrorHandler<T>;
}

declare interface Settings {
    get<T>(key: string, defaultValue: T): T;
    set<T>(key: string, value: T): T;
    delete<T>(key: string): void;
    getValidated<T>(obj: Collection<T>, settingKey: string, defaultKey: string): T;
    setValidated<T>(obj: Collection<T>, settingKey: string, objKey: string, defaultKey: string): string;
    onMutation<T>(key: string, callback: (key: string, oldValue: T, newValue: T) => void): string;
    of<T>(key: string, defaultValue: T, decoder?: ((obj: object) => T), encoder?: ((value: T) => Promise<object>|object)): CachedSetting<T>;
    of<T>(key: string, defaultValue: T, decoder?: ((obj: object) => Promise<T>), encoder?: ((value: T) => Promise<object>|object)): Promise<CachedSetting<T>>;
}

declare class CachedSetting<T> extends Observable<T> {
    key: string;
    defaultValue: T;
    value: T;
    #selfRef: this | Promise<this>;

    constructor (settings: Settings, key: string, defaultValue: T, decoder?: ((obj: object) => T), encoder?: ((value: T) => Promise<object>|object));
    #setupValue(rawValue, defaultValue, decoder: ((obj: object) => T | Promise<T>) | undefined): this | Promise<this>;
}

declare interface Monkey {
    /**
     * Method used to send http requests from within this tamper monkey script
     */
    getDataFrom<T>(url: string, type: DataType<T>, {headers, handler, onError, allowedStatuses}: (BaseMonkeyRequestData<T>)): Promise<T | undefined>
    /**
     * Method used to send http requests from within a tamper monkey script using {@link GM_xmlhttpRequest}
     * 
     * See {@link MonkeyRequestData} for info on other paramaters of the method
     */
    requestFrom<T>(url: string, {method, type, allowedStatuses, headers, data, handler, onError}: (MonkeyRequestData<T>)): Promise<T>
    error: (title: string, message: string, error?: Error) => void,
    debug: (title: string, message: string, error?: Error) => void,
    settings: Settings,
    /**
     * Method used to add the given CSS to the document using {@link GM_addStyle}
     * @param {string} css - The CSS string to inject.
     * @returns {HTMLStyleElement} The injected style element.
     */
    addStyle: GM_addStyle
}

declare const monkey: Monkey;