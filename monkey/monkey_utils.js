// #region Monkey Settings Def
class Settings {
    /**
     * @template T
     * @param {string} key - Key within the settings
     * @param {T} defaultValue - value to be gotten as a default
     * @returns {T}
     */
    get(key, defaultValue) { return GM_getValue(key, defaultValue); }
    /**
     * @template T
     * @param {string} key - Key within the settings
     * @param {T} value - value to be set
     * @returns {T}
     */
    set(key, value)  { 
        GM_setValue(key, value);
        return value;
    }
    /**
     * @template T
     * @param {string} key - Key within the settings
     * @param {T} value - value to be set
     * @returns {void}
     */
    delete(key) { GM_deleteValue(key); }
    /**
     * @template T
     * @param {Collection<T>} obj
     * @param {string} settingKey 
     * @param {string} defaultObjKey 
     * @returns {T}
     */
    getValidated(obj, settingKey, defaultKey) { return getFromCollectionValidated(obj, this.get(settingKey, defaultKey), defaultKey); }
    /**
     * @template T
     * @param {Collection<T>} obj
     * @param {string} settingKey 
     * @param {string} objKey 
     * @param {string} defaultKey 
     * @returns {string}
     */
    setValidated(obj, settingKey, objKey, defaultKey) { 
        return this.set(settingKey, validateKeyWithCollection(obj, objKey, defaultKey));
    }
    /**
     * @template T
     * @param {string} key 
     * @param {(key: string, oldValue: T, newValue: T)} callback 
     * @returns {string}
     */
    onMutation(key, callback) {
        GM_addValueChangeListener(key, (key, oldValue, newValue) => callback(key, oldValue, newValue));
    }
    /**
     * @template T
     * @param {string} key
     * @param {T} defaultValue
     * @param {((object) => T) | undefined} decoder
     * @param {((T) => object) | undefined} encoder
     * @returns {Promise<CachedSetting<T>>}
     */
    async of(key, defaultValue, decoder = (obj) => obj, encoder = (obj) => obj) {
        const setting = new CachedSetting(this, key, defaultValue, decoder, encoder);
        await setting.valueSetGate;
        return setting;
    }
}

/**
 * @template T
 * @extends {Observable<T>}
 */
class CachedSetting extends Observable {
    /** 
     * @type(string) 
     * */
    key;
    /** 
     * @type(T) 
     * */
    defaultValue;
    /** 
     * @private
     * @type(T) 
     * */
    value;
    /**
     * @private
     * @type(Promise<void>)
     */
    valueSetGate;

    /**
     * @constructor
     * @param {Settings} settings
     * @param {string} key
     * @param {T} defaultValue

     * @param {((T) => object) | undefined} encoder
     */
    constructor (settings, key, defaultValue, decoder = (obj) => obj, encoder = (obj) => obj) {
        super(() => this.value, (value) => settings.set(key, encoder(value)));
        this.key = key;
        this.defaultValue = defaultValue;
        this.valueSetGate = this.#setupValue(settings.get(key), defaultValue, decoder);
        settings.onMutation(key, async (key, oldValue, newValue) => {
            this.value = await decoder(newValue);
            this.onChangeInvoker(this.value);
        })
    }

    /**
     * @param {((object) => T | Promise<T>) | undefined} decoder
     */
    async #setupValue(rawValue, defaultValue, decoder) {
        this.value = (rawValue != null) ? await decoder(rawValue) : defaultValue;
    }
}

// #endregion

// #region Monkey Object Def

/**
 * @import { } from './monkey_utils' 
 */

const ErrorType = Object.freeze({
    ERROR: "error",
    ABORT: "abort",
    TIMEOUT: "timeout",
    INVALID_STATUS: "invalid_status",
    HANDLER_ERROR: "handler_error"
})

const monkey = {
    /**
     * Method used to send http requests from within this tamper monkey script
     * 
     * @param {string}                                                       url - url target for the request
     * @param {{[key: string]: string;} | undefined}                         headers - extra headers (auth is added automatically!)
     * @param {((error: Object|Error, type: ErrorType) => T) | undefined}    onError - Function to handle errors of either caused by the handling of the response or from the request call
     * @returns {Promise<Blob | undefined>}
     */
    getBlobFrom(url, headers, onError) {
        return this.getDataFrom(url, "blob", headers, (data) => data.response, onError);
    },
    /**
     * Method used to send http requests from within this tamper monkey script
     * 
     * @param {string}                                                       url - url target for the request
     * @param {{[key: string]: string} | undefined}                          headers - extra headers (auth is added automatically!)
     * @param {((error: Object|Error, type: ErrorType) => T) | undefined}    onError - Function to handle errors of either caused by the handling of the response or from the request call
     * @returns {Promise<ArrayBuffer | undefined>}
     */
    getArrayBuffer(url, headers, onError) {
        return this.getDataFrom(url, "arraybuffer", headers, (data) => data.response, onError);
    },
    /**
     * Method used to send http requests from within this tamper monkey script
     * 
     * @template T
     * @param {"arraybuffer" | "blob" | "json" | "stream" | "text" | undefined} type - type of data to be returned from the response
     * @param {string}                                                       url - url target for the request
     * @param {{[key: string]: string} | undefined}                          header - extra headers (auth is added automatically!)
     * @param {(Object) => T}                                                handler - Function that handles the response data and turns it into the required data
     * @param {((error: Object|Error, type: ErrorType) => T) | undefined}    onError - Function to handle errors of either caused by the handling of the response or from the request call
     * @returns {Promise<T|undefined>}
     */
    getDataFrom(url, type, headers, handler = (data) => data.response, onError) {
        return this.requestFrom(url, {method: "get", type: type, headers: headers, handler: handler, onError: (onError ?? ((obj, errType) => {
            const error = obj instanceof Error ? obj : undefined;
            const msg = obj instanceof Error ? obj.message : JSON.stringify(obj, 2)
            this.error(`Fetcher Error`, `Fetching ${type} data from '${url}' lead to the following '${errType}' error: ${msg}`, error)
            console.error(obj);
            return undefined;
        }))});
    },
    /**
     * @template T
     * @typedef {Object} MonkeyRequestData
     * @property {string}                                                                                 method - method request type either being GET, POST, PATCH, or DELETE
     * @property {"arraybuffer" | "blob" | "json" | "stream" | "text" | undefined}                        type - type of data to be returned from the response
     * @property {(number) => boolean}                                                                    allowedStatuses - test function used to check if the status is allowed or is an error
     * @property {{[key: string]: string} | undefined}                                                    headers - extra headers (auth is added automatically!)
     * @property {string | Blob | File | Object | Array<any> | FormData | URLSearchpropertys | undefined} data - request body for PATCH/POST
     * @property {(Object) => T}                                                                          handler - Function that handles the response data and turns it into the required data
     * @property {(error: Object|Error, type: ErrorType) => T}                          onError - Function to handle errors of either caused by the handling of the response or from the request call
     */
    /**
     * Method used to send http requests from within a tamper monkey script using {@link GM_xmlhttpRequest}
     * 
     * See {@link MonkeyRequestData} for info on other paramaters of the method
     * 
     * @template T
     * @param {string} url - url target for the request
     * @returns {Promise<T>}
     */
    async requestFrom(url, /** @type(MonkeyRequestData<T>) */ {method = "get", type, allowedStatuses = generalStatusCodeRange, headers, data, handler, onError} = {}) {
        this.debug("Request From Info", `[${method}, ${type}]: ${url}`);
        if (!url) return onError("Invalid URL given as its null");
        return await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: method, url: url, responseType: type, headers: { ...(headers ?? {}) }, data: data,
                onload: function(response) {
                    if (allowedStatuses(response.status)) {
                        try {
                            resolve(handler(response))
                        } catch (error) {
                            resolve(onError(error, ErrorType.HANDLER_ERROR))
                        }
                    } else {
                        resolve(onError(response, ErrorType.INVALID_STATUS))
                    }
                },
                onerror: function(response) { resolve(onError(response, ErrorType.ERROR)) },
                onabort: function(response) { resolve(onError(response, ErrorType.ABORT)) },
                ontimeout: function(response) { resolve(onError(response, ErrorType.TIMEOUT)) },
            });
        });
    },
    error: (title, message, error) => {
        console.error(`${title}: ${message}`, error)
    },
    debug: (title, message, error) => {
        console.debug(`${title}: ${message}`, error)
    },
    settings: new Settings(),
    /**
     * Method used to add the given CSS to the document using {@link GM_addStyle}
     * @param {string} css - The CSS string to inject.
     * @returns {HTMLStyleElement} The injected style element.
     */
    addStyle: GM_addStyle
}

//#endregion