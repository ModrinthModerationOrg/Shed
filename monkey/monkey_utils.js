/** @import { ErrorType, XMLResponseType, RequestErrorHandler, MonkeyRequestData } from './monkey_utils' */
/** @import { generalStatusCodeRange } from '../misc/index' */

/** @type { ErrorType } */
const ErrorType = Object.freeze({
    ERROR: "error",
    ABORT: "abort",
    TIMEOUT: "timeout",
    INVALID_STATUS: "invalid_status",
    HANDLER_ERROR: "handler_error",
})

/** @type {XMLResponseType} */
const XMLResponseType = Object.freeze({
    ARRAYBUFFER: "arraybuffer",
    TEXT: "text",
    JSON: "json",
    BLOB: "blob" ,
    STREAM: "stream",
})

/** @type {Monkey} */
const monkey = {
    getDataFrom(url, type, {headers, handler, onError, allowedStatuses} = {}) {
        return this.requestFrom(url, {method: "get", type, headers, allowedStatuses,
            handler: handler ?? ((data) => data.response),
            onError: (onError ?? ((obj, errType, thrownError) => {
                const msg = thrownError != null ? thrownError.message : JSON.stringify(obj, 2)
                this.error(`Fetcher Error`, `Fetching ${type} data from '${url}' lead to the following '${errType}' error: ${msg}`, thrownError)
                console.error(obj);
                return undefined;
            }))
        });
    },
    async requestFrom(url, {method = "get", type = XMLResponseType.TEXT, allowedStatuses = generalStatusCodeRange, headers, data, handler, onError} = {}) {
        this.debug("Request From Info", `[${method}, ${type}]: ${url}`)
        return await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: method, url: url, responseType: type, headers: { ...(headers ?? {}) }, data: data,
                onload: function(response) {
                    if (allowedStatuses(response.status)) {
                        try {
                            resolve(handler(response))
                        } catch (error) {
                            resolve(onError(response, ErrorType.HANDLER_ERROR, error))
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
    error: (title, message, error) => { console.error(`${title}: ${message}`, error) },
    debug: (title, message, error) => { console.debug(`${title}: ${message}`, error) },
    settings: {
        get(key, defaultValue) { 
            return GM_getValue(key, defaultValue); 
        },
        set(key, value)  { 
            GM_setValue(key, value);
            return value;
        },
        delete(key) { 
            GM_deleteValue(key); 
        },
        getValidated(obj, settingKey, defaultKey) {
            return getFromCollectionValidated(obj, this.get(settingKey, defaultKey), defaultKey); 
        },
        setValidated(obj, settingKey, objKey, defaultKey) { 
            return this.set(settingKey, validateKeyWithCollection(obj, objKey, defaultKey));
        },
        onMutation(key, callback) {
            GM_addValueChangeListener(key, (key, oldValue, newValue) => callback(key, oldValue, newValue));
        },
        of(key, defaultValue, endec) {
            return Setting.of(this, key, defaultValue, endec)
        },
    },
    addStyle: GM_addStyle
}

//#endregion