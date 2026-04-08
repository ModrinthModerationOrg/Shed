// #region Modrinth Application Setup

/**
 * @typedef {Object} ModrinthApplication
 * @property {NotificationManager} notificationManager - 
 * @property {ModrinthClient} modrinthClient -
 */

/**
 * @typedef {Object} NotificationManager
 * @property {({title: string, text: string, type: string}) => void} addNotification - 
 */

/**
 * Base error class for all Modrinth API errors
 * @typedef {Object} ModrinthApiError
 * @property {number?} statusCode - 
 * @property {Error?} originalError - 
 * @property {any?} responseData - 
 * @property {string?} context - 
 */

/**
 * Error class for Modrinth server errors (kyros/archon)
 * Extends ModrinthApiError with V1 error response parsing
 * @typedef {Object} ModrinthServerError
 * @property {number?} statusCode - 
 * @property {Error?} originalError - 
 * @property {any?} responseData - 
 * @property {string?} context - 
 * @property {ModrinthErrorResponse} v1Error -
 */

/**
 * Modrinth V1 error response format
 * Used by kyros + archon APIs
 * @typedef {Object} ModrinthErrorResponse
 * @property {string} error - 
 * @property {string} description - 
 * @property {string?} context - 
 */

/***
 * @typedef {Object} RequestData
 * @property        {string}         api - 'labrinth' → api.modrinth.com, 'archon' → archon.modrinth.com, or a full URL
 * @property {number|string}     version - revisionNumber (→ /v2/), 'internal' (→ /_internal/), or a string
 * @property        {string}      method - method request type either being GET, POST, PATCH, or DELETE
 * @property        {string}        path - path for the api request
 * @property        {object}      params - query string params
 * @property        {object}        body - request body for PATCH/POST
 * @property        {object}     headers - extra headers (auth is added automatically!)
 * @property       {boolean}    skipAuth - opt out of auto-auth useful for public endpoints
 */

/**
 * @typedef {Object} ModrinthClient
 * @property {(path: string, data: RequestData) => Promise<object|ModrinthApiError>} request - Method used to send requests within modrinths API using applications client
 */


/**
 * Represents a function that accepts one argument and produces a result.
 * 
 * @callback MutationCallback
 * @param {boolean} isMatch
 * @param {StateManager} manager
 * @return {void} 
 */

/**
 * A manager used to track the current state of the modrinth application useful for figuring out what is the current project is
 */
class StateManager {
    static generalValidRegex = new RegExp("https:\/\/modrinth.com\/(((project|mod|plugin|resourcepack|datapack|modpack|shader|plugin|server)\/([^\/]+)(\/)?((version(s)?|settings|gallery|changelog|moderation)(\/)?([^\/]+)?)?$)|(moderation\/technical-review((\/([^\/]+$)))?))", "m");

    /** @type {string} */ url = "";
    /** @type {string?} */ slug = null;
    /** @type {ModrinthProject?} */ project = null;

    /**
     * Gets the current cached project for the StateManager instance if possible and the id matches or instead getting a new project
     * @param {string} projectId - Project ID
     */
    async getProjectFor(projectId) {
        return await this.#getProjectFor(projectId);
    }

    /**
     * Wrapper around {@link project} that attempts to get the project
     * @returns {string | null} 
     */
    projectId() {
        return this.project?.id;
    }

    /**
     * Method used to register a tool that may not always be present depending on the state of the modrinth application
     * @param {RegExp} regex - 
     * @param {string} id - 
     * @param {MutationCallback} callback -
     * @returns {boolean} if the given register callback worked for the given callback
     */
    registerElement(regex, id, callback){
        return this.#registerElement(regex, id, callback)
    }

    /**
     * Used to update if a given element has external changes that may impact it being present or not
     * @param {string} id - 
     * @returns {boolean} was able to locate callback and update it
     */
    updateElement(id) {
        return this.#updateElement(id)
    }

    //--

    /**
     * @returns {Promise<StateManager>}
     */
    async initManager() {
        this.#isSetup = true;
        new MutationObserver(() => {
            setTimeout(() => {
                if (window.location.href !== this.url) {
                    console.log(`Moving from '${this.url}' to '${window.location.href}'`);
                    this.url = window.location.href;

                    // DO NOT UNDO LAMDA HERE AS IT FREAKS OUT FYI
                    setTimeout(async () => this.#handleUrlChange(), 100);
                }
            }, 100);
        }).observe(document.body, { childList: true, subtree: true });

        this.url = window.location.href;

        await this.#handleUrlChange();
        return this;
    }

    //#region internal
    /*** @type {Map<RegExp, Array<MutationCallback>>} */
    #expToCallback = new Map();
    /*** @type {Map<String, {regex: RegExp, callback: MutationCallback}>} */
    #idToCallback = new Map();

    /*** @type {Map<RegExp, boolean>} */
    #results = new Map();

    #isSetup = false;

    /**
     * @private
     * @param {RegExp} regex - 
     * @param {string} id - 
     * @param {MutationCallback} callback -
     * @returns {boolean} if the given register callback worked for the given callback
     */
    #registerElement(regex, id, callback){
        const existingCallback = this.#idToCallback.get(id);

        if (existingCallback != null) {
            app.error("State Manager", `Unable to add new widget as it seems to share its id with another: ${id}`)
            return false;
        }

        var entries = this.#expToCallback.get(regex);

        if (entries == null) {
            entries = [];
            this.#expToCallback.set(regex, entries);
        }

        entries.push(callback)

        this.#idToCallback.set(id, { regex: regex, callback: callback })

        if (this.#isSetup) {
            callback(this.#results[regex] = this.#results[regex] ?? regex.test(this.url), this)
        }

        return true;
    }

    /**
     * @private
     * @param {string} projectId - 
     */
    async #getProjectFor(projectId) {
        if (this.project != null && this.project.id == projectId) return this.project;
        const project = await getModrinthProject(projectId);
        if (this.url.includes("technical-review")) this.project = project
        return project;
    }

    /**
     * @private
     * @param {string} id - 
     * @returns {boolean} was able to locate callback
     */
    #updateElement(id) {
        const callbackData = this.#idToCallback.get(id);
        if (callbackData == null) return false;
        callbackData.callback(callbackData.regex.test(this.url), this)
        return true;
    }

    async #handleUrlChange() {
        let shouldReset = true;

        if (StateManager.generalValidRegex.test(this.url)) {
            const newSlug = getSlugFromURL(this.url);
            if (newSlug != null) {
                if (newSlug != this.slug || this.project == null) {
                    this.project = await getModrinthProjecFromtUrl(this.url);
                    this.slug = newSlug;
                }

                shouldReset = false;
            }
        }

        if (shouldReset) this.slug = this.project = null;

        for (const [regex, callbacks] of this.#expToCallback) {
            const result = this.#results[regex] = regex.test(this.url)

            for (const callback of callbacks) callback(result, this)
        }
    }

    //#endregion
};

/**
 * Enum for message types used within the {@link app.infomUser} method
 * @readonly
 * @enum {{name: string, hex: string}}
 */
const MessageType = Object.freeze({
    DEBUG: { name: "debug", hex: "#0FF" },
    SUCCESS: { name: "success", hex: "#0f0" },
    INFO: { name: "warn", hex: "#FFF" },
    ERROR: { name: "error", hex: "#f00" },
    WARN: { name: "warn", hex: "#ff0" }
});

const app = {
    /** 
     * @private
     * @type(ModrinthApplication) 
     */
    _application: null,
    async getInternalApp() {
        if (this._application == null) {
            // Create proxy for modrinth application
            // Author: Chyzman
            const providers = await waitForElementValue('#__nuxt', (root) => { return root._vnode?.component?.subTree?.ssContent?.component?.provides }, 40);

            this._application = new Proxy({}, {
                get(_, key) {
                    return providers[Symbol.for('modrinth:' + key)];
                }
            })
        }
        
        return this._application;
    },
    async notificationManager() { return (await this.getInternalApp()).notificationManager },
    async client() { return (await this.getInternalApp()).modrinthClient },
    /**
     * Send debug message to conolse and modrinth app
     * @param {string} title - 
     * @param {string|object} text 
     */
    debug(title, msg) { this.infomUser(MessageType.DEBUG, title, msg); },
    /** 
     * Send info message to conolse and modrinth app 
     * @param {string} title - 
     * @param {string|object} text 
     */
    info(title, msg) { this.infomUser(MessageType.INFO, title, msg); },
    /**
     * Send success message to conolse and modrinth app
     * @param {string} title - 
     * @param {string|object} text 
     */
    success(title, msg) { this.infomUser(MessageType.SUCCESS, title, msg); },
    /**
     * Send warn message to conolse and modrinth app
     * @param {string} title - 
     * @param {string|object} text 
     */
    warn(title, msg) { this.infomUser(MessageType.WARN, title, msg); },
    /**
     * Send error message to conolse and modrinth app
     * @param {string} title - 
     * @param {string|object} text - 
     */
    error(title, msg) { this.infomUser(MessageType.ERROR, title, msg); },
    /**
     * Used to send message to the browsers console and possibly to the modrinth notification system
     * @param {MessageType|string} type - Type of message being one of the 5 possible types i.e. DEBUG, INFO, SUCCESS, WARN, ERROR
     * @param {string} title - 
     * @param {string|object} text - 
     */
    infomUser(type, title, msg) {
        if (type instanceof String) type = MessageType[type];
        const logMsg = [`[${title}]:`, msg];
        if (type.name == "error") {
            console.error(logMsg);
        } else if (type.name == "warn") {
            console.warn(logMsg);
        } else if (type.name == "debug") {
            console.debug(logMsg);
        } else {
            console.log(logMsg);
        }

        if (type == MessageType.DEBUG && !this.showDebugToast()) return;

        this.notificationManager().then((manager) => {
            manager.addNotification({ title: title, text: msg, type: type.name });
        })
    },
    /**
     * Method used to check if the given should show debug toasts within modrinths notification system.
     * 
     * Can be replaced with customh hook.
     */
    showDebugToast: () => false,
    /**
     * Method used to send requests within modrinths API using applications client
     * 
     * @param        {string}         api - 'labrinth' → api.modrinth.com, 'archon' → archon.modrinth.com, or a full URL
     * @param {number|string}     version - revisionNumber (→ /v2/), 'internal' (→ /_internal/), or a string
     * @param        {string}      method - method request type either being GET, POST, PATCH, or DELETE
     * @param        {string}        path - path for the api request
     * @param        {object}      params - query string params
     * @param        {object}        body - request body for PATCH/POST
     * @param        {object}     headers - extra headers (auth is added automatically!)
     * @param       {boolean}    skipAuth - opt out of auto-auth useful for public endpoints
     * @returns {Promise<object|ModrinthApiError>}
     */
    async request(api, version, method, path, params, body, headers, skipAuth) {
        this.debug("Modrinth API Request", `Running ${api} Request ${method} v${version} at path ${path}`)
        try {
            const client = await this.client()
            const result = await client.request(path, {
                api: api,
                version: version,
                method: method,
                params: params,
                body: body,
                headers: headers,
                skipAuth: skipAuth,
            });
            
            this.debug("Modrinth API Request", `Value of ${api} Request ${method} v${version} at path ${path} is: ${result}`)
            return result;
        } catch (err) {
            return err;
        }
    },
    /**
     * Method used to send requests within modrinths API using applications client
     * 
     * @param {RequestMethod}   method - method request type either being GET, POST, PATCH, or DELETE
     * @param        {object}   params - query string params
     * @param        {object}     body - request body for PATCH/POST
     * @param        {object}  headers - extra headers (auth is added automatically!)
     * @param       {boolean} skipAuth - opt out of auto-auth useful for public endpoints
     */
    async labrinthGetRequest(path, params, body, headers, skipAuth) {
        return await this.request('labrinth', 3, 'GET', path, params, body, headers, skipAuth)
    },
    state: new StateManager()
}

await app.state.initManager();

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
            if (!locatedValue) app.debug("Waiting for: " + selector)
        }, interval);
    });
}

async function getModrinthIdOrSlug(url) {
    return (await getModrinthProject(getSlugFromURL(url))).id;
}

/**
 * @typedef ModrinthProject
 * @type {object}
 * @property {string} name - Title of the given project i.e. its name
 * @property {string} id - project id.
 * @property {string} slug - project slug.
 * @property {string} project_type - project type
 * @property {DonationLink[]} donation_urls - Donation urls of the project
 * @property {string} issues_url - Url for project issues
 * @property {string} source_url - Url for project sources
 * @property {string} wiki_url - Url for project wiki
 * @property {string} discord_url - Url for project discord
 * @property {string} team_id - Id for the team of the project
 * @property {string} organization - Id for the organization of the project
 */

/**
 * @returns {Promise<ModrinthProject>}
 */
async function getModrinthProjecFromtUrl(url) {
    return (await getModrinthProject(getSlugFromURL(url)));
}

/**
 * @returns {Promise<ModrinthProject>}
 */
async function getModrinthProject(id) {
    return validateModrinthResponse(await app.labrinthGetRequest(`/project/${id}`), (msg) => {
        app.error(`Project Info Getter`, msg)
        return { id: id }
    });
}
