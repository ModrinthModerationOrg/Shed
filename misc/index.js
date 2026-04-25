class Observable {
    static of(startingValue) {
        var value = startingValue;
        return new Observable(() => value, (newValue) => value = newValue);
    }

    static and(...observables){
        const wrapper = new Observable(() => {
            for (const observable of observables) {
                if (!observable.get()) return false;
            }
            return true;
        });

        const onChange = (value) => wrapper.onChangeInvoker(wrapper.get());
        observables.forEach((observable) => observable.onChange(onChange));

        return wrapper;
    }

    static or(...observables){
        const wrapper = new Observable(() => {
            for (const observable of observables) {
                if (observable.get()) return true;
            }
            return false;
        });

        const onChange = (value) => wrapper.onChangeInvoker(wrapper.get());
        observables.forEach((observable) => observable.onChange(onChange));

        return wrapper;
    }

    constructor (getCallback, setCallback, runChangeCallbackOnSet) {
        this.get = getCallback;
        this.set = (value) => {
            if (setCallback != null) setCallback(value);
            if (runChangeCallbackOnSet ?? true) this.onChangeInvoker(value);
        };
    }

    onChange(callback) {
        (this.listeners ??= []).push(callback)
        return this;
    };
    
    /** @private */
    onChangeInvoker(value) {
        for (const callback of this.listeners ?? []) {
            callback(value)
        }
    }
}

const _fallThoughEndec = { decode: (value) => value, encode: (value) => value, }

class Setting extends Observable {
    key;
    defaultValue;
    endec;

    /** @private */ 
    value;

    /** @private @type(Promise<T>|null) */
    valueSetLock;

    constructor (settings, key, defaultValue, endec = _fallThoughEndec) {
        super(() => this.value, async (value) => settings.set(key, await (endec.encode(value))), false);
        this.key = key;
        this.defaultValue = defaultValue;
        this.endec = endec;
        this.valueSetLock = this.#setupValue(settings, defaultValue);
        settings.onMutation(key, async (key, oldValue, newValue) => {
            onChangeInvoker(this.value = await (endec.decode(newValue)));
        })
    }

    /**
     * @param {((object) => T | Promise<T>) | undefined} decoder
     */
    #setupValue(settings) {
        const rawValue = settings.get(this.key);
        const result = /** @type(T) */ ((rawValue != null) ? this.endec.decode(rawValue) : this.defaultValue);
        if (result.then != null) {
            return Promise.resolve(result).then((value) => this.value = value)
        } else {
            this.value = result;
        }
        
        return null;
    }

    static of(settings, key, defaultValue, endec = _fallThoughEndec) {
        const setting = new Setting(settings, key, defaultValue, endec);
        if (setting.valueSetLock == null) return setting;
        const lock = setting.valueSetLock;
        setting.valueSetLock = null;
        return lock.then((obj) => setting);
    }
}

class Endec {
    constructor(decode, encode) {
        this.decode = decode;
        this.encode = encode;
    }
}

class AsyncEndec {
    constructor(decode, encode) {
        this.decode = decode;
        this.encode = encode;
    }
}

function getFromCollectionValidated(obj, key, defaultKey) {
    return getFromCollection(obj, validateKeyWithCollection(obj, key, defaultKey));
}

function getFromCollection(obj, key) {
    return Array.isArray(obj) ? key : (obj instanceof Map ? obj.get(key) : obj[key]) ;
}

function validateKeyWithCollection(obj, key, defaultKey) {
    /*** @type(Array<string>) */
    const array = Array.isArray(obj) ? obj : (obj instanceof Map ? Array.from(obj.keys()) : Object.keys(obj));
    if (!array.includes(key)) key = defaultKey;
    return key;
}

function generalStatusCodeRange(status) {
    return status >= 200 && status < 300
}


class TreeNode {
    parent;
    children = new Map();
    name;
    path;

    constructor(parent, name, path) {
        this.parent = parent;
        this.name = name;
        this.path = path;
    }

    sort(compare) {
        this.children = new Map(Array.from(this.children.entries()).sort((entry1, entry2) => compare(entry1[1], entry2[1])));
        for (const value of this.children.values()) value.sort(compare);
        return this;
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