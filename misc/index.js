/**
 * Represents a function that accepts one argument and produces a result.
 * 
 * @template T
 * @callback OnMutation
 * @param {T} value
 * @return {void} 
 */

/**
 * @template T
 */
class Observable {
    /** @type(Array<OnMutation<T>>) */
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
            if (setCallback != null) setCallback(value);
            this.onChangeInvoker(value);
            return value;
        };
    }

    /**
     * @param {(callback: OnMutation<T>) => void} callback 
     */
    onChange(callback) {
        this.listeners.push(callback)
        return this;
    };
    
    /** 
     * @protected
     * @type(OnMutation<T>) 
     */
    onChangeInvoker = (value) => {
        for (const callback of this.listeners) {
            callback(value)
        }
    }
}


/**
 * @template T
 * @param {Collection<T>} obj
 * @param {string} objKey 
 * @param {string} defaultObjKey 
 * @returns {T}
 */
function getFromCollectionValidated(obj, key, defaultKey) {
    return getFromCollection(obj, validateKeyWithCollection(obj, key, defaultKey));
}

/**
 * @template T
 * @param {Collection<T>} obj
 * @param {string} key 
 * @returns {T}
 */
function getFromCollection(obj, key) {
    return Array.isArray(obj) ? key : (obj instanceof Map ? obj.get(key) : obj[key]) ;
}

/**
 * @template T
 * @param {Collection<T>} obj
 * @param {string} objKey 
 * @param {string} defaultObjKey 
 * @returns {T}
 */
function validateKeyWithCollection(obj, key, defaultKey) {
    /*** @type(Array<string>) */
    const array = Array.isArray(obj) ? obj : (obj instanceof Map ? Array.from(obj.keys()) : Object.keys(obj));
    if (!array.includes(key)) key = defaultKey;
    return key;
}

/**
 * @param {number} status 
 */
function generalStatusCodeRange(status) {
    return status >= 200 && status < 300
}

/**
 * @template {TreeNode<N>} N
 */
class TreeNode {
    /** @type {TreeNode<N>?} */
    parent;

    /** @type {Map<string, N>} */
    children = new Map();

    /** @type {string} */
    name;

    /** @type {string} */
    path;

    /**
     * @param {string} name
     * @param {string} path
     * @param {TreeNode<N>?} parent
     */
    constructor(parent, name, path) {
        this.parent = parent;
        this.name = name;
        this.path = path;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForElementValue(selector, getter, interval = 100) {
    return new Promise((resolve) => {
        const check = setInterval(() => {
            const el = document.querySelector(selector);
            var locatedValue = false;
            if (el) {
                const value = getter(el);
                if (value) {
                    clearInterval(check);
                    resolve(value);
                    locatedValue = true;
                }
            }
            if (!locatedValue) (app ?? console).debug("Waiting for: " + selector)
        }, interval);
    });
}