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

//#region Monky Defs

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
    getValidated(obj, settingKey, defaultKey) { return getFromCollectionValidated(obj, _settings.get(settingKey, defaultKey), defaultKey); }
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
        _settings.set(settingKey, objKey);
        return objKey;
    }
}

const monkey = {
    /**
     * Method used to send http requests from within this tamper monkey script
     * 
     * @param {string}                                                                     url - url target for the request
     * @param {{[key: string]: string;} | undefined}                                    header - extra headers (auth is added automatically!)
     * @returns {Promise<Blob | undefined>}
     */
    getBlobFrom(url, header) {
        return this.getDataFrom("blob", url, header);
    },
    /**
     * Method used to send http requests from within this tamper monkey script
     * 
     * @param {string}                                                                     url - url target for the request
     * @param {{[key: string]: string} | undefined}                                    header - extra headers (auth is added automatically!)
     * @returns {Promise<ArrayBuffer | undefined>}
     */
    getArrayBuffer(url, header) {
        return this.getDataFrom("arraybuffer", url, header);
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
