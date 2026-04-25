/// <reference path="./tamper_monkey.d.ts" />
/// <reference path="../misc/index.d.ts" />
//import { GMXMLRequest, DataType } from './tamper_monkey';

declare enum ErrorType {
    ERROR = "error",
    ABORT = "abort",
    TIMEOUT = "timeout",
    INVALID_STATUS = "invalid_status",
    HANDLER_ERROR = "handler_error",
}
declare class XMLResponseType {
    static readonly ARRAYBUFFER: DataType<ArrayBuffer>;
    static readonly TEXT: DataType<string>;
    static readonly JSON: DataType<Record<string, any>>;
    static readonly BLOB: DataType<Blob>;
    static readonly STREAM: DataType<any>; // TODO: FIGURE OUT WHAT TYPE THIS IS 
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

declare interface MonkeySettings extends Settings {
    delete<T>(key: string): void;
    getValidated<T>(obj: Collection<T>, settingKey: string, defaultKey: string): T;
    setValidated<T>(obj: Collection<T>, settingKey: string, objKey: string, defaultKey: string): string;
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
    settings: MonkeySettings,
    /**
     * Method used to add the given CSS to the document using {@link GM_addStyle}
     * @param {string} css - The CSS string to inject.
     * @returns {HTMLStyleElement} The injected style element.
     */
    addStyle: (css: string) => HTMLStyleElement;
}

declare const monkey: Monkey;