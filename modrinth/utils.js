/**
 * @template T
 */
class Observerable {
    /** @type(Array<MutationCallback<T>>) */
    listeners = [];
    /** @readonly @type(() => T) */
    get;
    /** @readonly @type((T) => T) */
    set;

    /**
     * @constructor
     * @param {() => T} getCallback
     * @param {((value: T) => T)?} setCallback
     */
    constructor (getCallback, setCallback) {
        this.get = getCallback;
        this.set = (value) => {
            if (setCallback != null) value = setCallback(value);
            this.onChangeInvoker(value);
            return value;
        };
    }

    /*** @type((callback: MutationCallback<T>) => void) */
    onChange = (callback) => this.listeners.push(callback);
    
    /** 
     * @protected
     * @type(MutationCallback<T>) 
     */
    onChangeInvoker = (value) => {
        for (const callback of this.listeners) {
            callback(value)
        }
    }
}

/*** @typedef {{[key: string]: T} | Map<String, T> | Array<string>} Collection */

/**
 * @template T
 * @param {Collection} obj
 * @param {string} objKey 
 * @param {string} defaultObjKey 
 * @returns {T}
 */
function getFromCollectionValidated(obj, objKey, defaultKey) {
    /*** @type(Array<string>) */
    const array = Array.isArray(obj) ? obj : (obj instanceof Map ? Array.from(obj.keys()) : Object.keys(obj));
    if (defaultKey != null && !array.includes(objKey)) objKey = defaultKey;
    return Array.isArray(obj) ? objKey : (obj instanceof Map ? obj.get(objKey) : obj[objKey]) ;
}

/**
 * @param {number} status 
 */
function generalStatusCodeRange(status) {
    return status >= 200 && status < 300
}

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
     * @param {Collection} obj
     * @param {string} settingKey 
     * @param {string} defaultObjKey 
     * @returns {T}
     */
    getValidated(obj, settingKey, defaultKey) { return getFromCollectionValidated(obj, this.get(settingKey, defaultKey), defaultKey); }
    /**
     * @template T
     * @param {Collection} obj
     * @param {string} settingKey 
     * @param {string} objKey 
     * @param {string} defaultKey 
     * @returns {string}
     */
    setValidated(obj, settingKey, objKey, defaultKey) { 
        /*** @type(Array<string>) */
        const array = Array.isArray(obj) ? obj : (obj instanceof Map ? Array.from(obj.keys()) : Object.keys(obj));
        if (!array.includes(objKey)) objKey = defaultKey;
        this.set(settingKey, objKey);
        return objKey;
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
        const setting = new CachedSetting(this, key, defaultValue, decoder, encoder);;
        await setting.valueSetGate;
        return setting;
    }
}

/**
 * @template T
 * @extends {Observerable<T>}
 */
class CachedSetting extends Observerable {
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

    /**
     * @template T
     * @param {() => Promise<T>} getCallback
     * @param {((value: T) => T)?} setCallback
     * @param {Consumer<Consumer<T>>} externalSourceUpdate
     * @returns {Promise<CachedObserverable<T>>}
     */
    static async of(getCallback, setCallback, externalSourceUpdate) {
        const entry = await getCallback();
        return new CachedObserverable(() => entry, setCallback, externalSourceUpdate);
    }
}

// #endregion

// #region Monkey Object Def
const monkey = {
    /**
     * Method used to send http requests from within this tamper monkey script
     * 
     * @param {string}                                                                     url - url target for the request
     * @param {{[key: string]: string;} | undefined}                                    header - extra headers (auth is added automatically!)
     * @returns {Promise<Blob | undefined>}
     */
    getBlobFrom(url, header) {
        return this.getDataFrom(url, "blob", header);
    },
    /**
     * Method used to send http requests from within this tamper monkey script
     * 
     * @param {string}                                                                     url - url target for the request
     * @param {{[key: string]: string} | undefined}                                    header - extra headers (auth is added automatically!)
     * @returns {Promise<ArrayBuffer | undefined>}
     */
    getArrayBuffer(url, header) {
        return this.getDataFrom(url, "arraybuffer", header);
    },
    /**
     * Method used to send http requests from within this tamper monkey script
     * 
     * @template T
     * @param {"arraybuffer", "blob", "json", "stream", "text" or undefined}                 type - type of data to be returned from the response
     * @param {string}                                                                       url - url target for the request
     * @param {{[key: string]: string} | undefined}                                          header - extra headers (auth is added automatically!)
     * @param {(Object) => T}                                                                handler - Function that handles the response data and turns it into the required data
     * @param {((type: string, url: string, error: string|number|Object) => T) | undefined}  onError - Function to handle errors of either caused by the handling of the response or from the request call
     * @returns {Promise<T>}
     */
    getDataFrom(url, type, header, handler = (data) => data.response, onError) {
        return this.requestFrom(url, {method: "get", type: type, header: header, handler: handler, onError: (onError ?? this.onGetResponseError)});
    },
    /**
     * @template T
     * @typedef {Object} MonkeyRequestData
     * @property {string}                                                                                 method - method request type either being GET, POST, PATCH, or DELETE
     * @property {"arraybuffer" | "blob" | "json" | "stream" | "text" | undefined}                        type - type of data to be returned from the response
     * @property {(number) => boolean}                                                                    allowedStatuses - test function used to check if the status is allowed or is an error
     * @property {{[key: string]: string} | undefined}                                                    header - extra headers (auth is added automatically!)
     * @property {string | Blob | File | Object | Array<any> | FormData | URLSearchpropertys | undefined} data - request body for PATCH/POST
     * @property {(Object) => T}                                                                          handler - Function that handles the response data and turns it into the required data
     * @property {(type: string, url: string, error: string|number|Object) => T}                          onError - Function to handle errors of either caused by the handling of the response or from the request call
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
        app.debug(`[${method}, ${type}]: ${url}`);
        if (!url) return onError("Invalid URL given as its null");
        return await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: method, url: url, responseType: type, headers: { ...(headers ?? {}) }, data: data,
                onload: function(response) {
                    if (allowedStatuses(response.status)) {
                        try {
                            resolve(handler(response))
                        } catch (error) {
                            resolve(onError(type, url, error.message))
                        }
                    } else {
                        resolve(onError(type, url, response.status))
                    }
                },
                onerror: function(response) {
                    resolve(onError(type, url, response))
                }
            });
        });
    },
    onGetResponseError(type, url, msg) {
        this.error(`${type} Fetcher`, `Unable to get the desired ${type} from '${url}' due to the following error: ${(msg instanceof Object ? JSON.stringify(obj, 2) : msg)}`)
        return null;
    },
    error: (title, message) => {
        console.error(`${title}: ${message}`)
    },
    settings: new Settings()
}

//#endregion
