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
 * @typedef {Object} ModrinthClient
 * @property {(path: string, data: RequestData) => Promise<object|ModrinthApiError>} request - Method used to send requests within modrinths API using applications client
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
 * @typedef ModrinthVersion
 * @type {object}
 * @property {string} id - project id.
 * @property {string} author_id - id of the author who uploaded the file
 * @property {string} version_number - The version number. Ideally will follow semantic versioning
 * @property {ModrinthVersionFile[]} files - project type
 */

/**
 * @typedef ModrinthVersionFile
 * @type {object}
 * @property {string} url - CDN url for the version field
 * @property {string} filename - 
 */

/**
 * @typedef ModrinthUser
 * @type {object}
 * @property {string} id - user id
 * @property {string} name - The user’s display name
 * @property {string} username - The user’s username
 */

/**
 * @typedef ModrinthOrganization
 * @type {object}
 * @property {string} name - Title of the given organization i.e. its name
 * @property {string} id - organization id.
 * @property {string} slug - organization slug.
 * @property {string} team_id - The ID of the team this organization of members is of
 * @property {Array<ModrinthTeamMember>} members - Members of the organization
 */

/**
 * @typedef ModrinthTeam
 * @type {object}
 * @property {string} id - The ID of the team this team member is a member of
 * @property {Array<ModrinthTeamMember>} members - Members of the team
 */

/**
 * @typedef ModrinthTeamMember
 * @type {object}
 * @property {string} id - The ID of the team this team member is a member of
 * @property {string} role
 * @property {boolean} is_owner
 * @property {ModrinthUser} user 
 */

/**
 * @callback OnMutationRegexCallback
 * @param {boolean} isMatch
 * @param {StateManager} manager
 * @return {void} 
 */

/**
 * @callback OnMutationCallback
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
     * @param {OnMutationRegexCallback} callback -
     * @returns {boolean} if the given register callback worked for the given callback
     */
    registerElement(regex, id, callback){
        return this.#registerElement(regex, id, callback)
    }

    /**
     * @private
     * @param {string} id - 
     * @param {OnMutationCallback} callback -
     * @returns {boolean} if the given register callback worked for the given callback
     */
    registerCallback(id, callback){
        return this.#registerCallback(id, callback)
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
                    setTimeout(async () => {
                        this.#handleUrlChange();
                        this.#runBasicCallbacks();
                    }, 25);
                } else {
                    this.#runBasicCallbacks();
                }
            }, 25);
        }).observe(document.body, { childList: true, subtree: true });

        this.url = window.location.href;

        await this.#handleUrlChange();
        this.#runBasicCallbacks();
        
        return this;
    }

    #runBasicCallbacks() {
        for (const callback of this.#basicCallbacks.values()) {
            callback(this);
        }
    }

    //#region internal

    /*** @type {Map<string, OnMutationCallback>} */
    #basicCallbacks = new Map();

    /*** @type {Map<RegExp, Array<OnMutationRegexCallback>>} */
    #expToCallback = new Map();
    /*** @type {Map<String, {regex: RegExp, callback: OnMutationRegexCallback}>} */
    #idToCallback = new Map();

    /*** @type {Map<RegExp, boolean>} */
    #results = new Map();

    #isSetup = false;

    /**
     * @private
     * @param {RegExp} regex - 
     * @param {string} id - 
     * @param {OnMutationRegexCallback} callback -
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
     * @param {string} id - 
     * @param {OnMutationCallback} callback -
     * @returns {boolean} if the given register callback worked for the given callback
     */
    #registerCallback(id, callback){
        const existingCallback = this.#basicCallbacks.get(id);

        if (existingCallback != null) {
            app.error("State Manager", `Unable to add new widget as it seems to share its id with another: ${id}`)
            return false;
        }

        this.#basicCallbacks.set(id, callback)

        if (this.#isSetup) callback(this)

        return true;
    }

    /**
     * @private
     * @param {string} projectId - 
     */
    async #getProjectFor(projectId) {
        if (this.project != null && this.project.id == projectId) return this.project;
        const project = await app.projectFor(projectId);
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
                    this.project = await app.projectFromUrl(this.url);
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

/**
 * @typedef DonationLink
 * @type {object}
 * @property {string} id - id for the donation service
 * @property {string} platform - platform name for the donation service
 * @property {string} url - url for the donation service
 */

function getSlugFromURL(/*** @type {string} */ url){
    const parts = url.replace("https://", "").split('/');
    const slug = (parts[2] == 'technical-review') ? parts[3] : parts[2];
    if (slug == null) {
        app.debug("[Modrinth Id/Slug Grabber] Could not parse slug from URL.");
        return null;
    }
    return slug;
}

function getVersionFromUrl(/*** @type {string} */ url){
    return url.replace("https://", "").split('/').pop();
}

/**
 * @param {ModrinthVersion} version
 */
function getVersionKey(version) {
    return `${version.id}/${version.version_number}`;
}

function validateModrinthResponse(response, onError) {
    if (response.name == "ModrinthApiError" || response.name == "ModrinthErrorResponse") {
        return onError(response);
    } else if(response.error) {
        return onError(`${response.error} - ${response.description}`);
    }
    
    return response
}

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
     * @returns {Promise<object|ModrinthApiError|Error>}
     */
    request(api, version, method, path, params, body, headers, skipAuth) {
        this.debug("Modrinth API Request", `Running ${api} Request ${method} v${version} at path ${path}`)
        try {
            return this.client().then(client => {
                return client.request(path, {
                    api: api,
                    version: version,
                    method: method,
                    params: params,
                    body: body,
                    headers: headers,
                    skipAuth: skipAuth,
                }).then(result => {
                    this.debug("Modrinth API Request", `Value of ${api} Request ${method} v${version} at path ${path} is: ${result}`)
                    return result;
                })
            });
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
    labrinthGetRequest(path, params, body, headers, skipAuth) {
        return this.request('labrinth', 3, 'GET', path, params, body, headers, skipAuth)
    },
    /**
     * @param {string} url - Url of the given project on modrinth
     */
    projectIdFromURl(url) {
        return this.projectFromUrl(url).then((project) => project.id)
    },
    /**
     * @param {string} url - Url of the given project on modrinth
     * @returns {Promise<ModrinthProject>}
     */
    projectFromUrl(url) {
        return this.projectFor(getSlugFromURL(url))
    },
    /**
     * @param {Slug|Identifier} id 
     * @returns {Promise<ModrinthProject>}
     */
    async projectFor(id) {
        return app.labrinthGetRequest(`/project/${id}`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                app.error(`Project Info Getter`, msg)
                return { id: id }
            })
        });
    },
    /**
     * @param {Slug|Identifier} id 
     */
    projectIdFor(id) {
        return this.projectFor(id).then((project) => project.id)
    },
    /**
     * @param {Slug|Identifier} projectId 
     * @param {Version|Identifier} versionId 
     * @returns {Promise<ModrinthVersion>}
     */
    projectVersionFor(projectId, versionId) {
        return app.labrinthGetRequest(`/project/${projectId}/version/${versionId}`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                app.error(`Project Version Id Grabber`, msg)
                return {
                    id: versionId,
                    project_id: projectId
                };
            })
        });
    },
    /**
     * @param {Slug|Identifier} projectId 
     * @returns {Promise<ModrinthVersion[]>}
     */
    projectVersionsFor(projectId) {
        return app.labrinthGetRequest(`/project/${projectId}/version`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                app.error(`Id/Slug Grabber`, msg)
                return [];
            });
        })
    },
    /**
     * @param {Slug|Identifier} projectId 
     * @returns {Promise<ModrinthVersion[]>}
     */
    primaryFileUrlsFor(projectId) {
        return this.projectVersionsFor(projectId).then(obj => {
            const files = [];
            for (const entry of obj) {
                files.push(entry.files[0].url);
            }
            return files;
        });
    },
    /**
     * @param {Slug|Identifier} projectId 
     */
    keyedPrimaryFileUrlsFor(projectId) {
        return this.projectVersionsFor(projectId).then(obj => {
            /*** @type(Map<string, string>) */
            const files = new Map();
            for (const entry of obj) {
                files.set(getVersionKey(entry), entry.files[0].url);
            }
            return files;
        });
    },
    /**
     * @param {Identifier} teamId 
     * @returns {Promise<ModrinthTeam>}
     */
    teamFor(teamId) {
        return app.labrinthGetRequest(`/team/${teamId}/members`).then(obj => {
            return {
                teamID: teamId,
                members: validateModrinthResponse(obj, () => {
                    app.error(`Team Member Info Getter`, msg)
                    return [];
                })
            }
        })
    },
    /**
     * @param {Identifier} teamId 
     * @returns {Promise<ModrinthOrganization>}
     */
    organizationFor(organizationId) {
        return app.labrinthGetRequest(`/organization/${organizationId}`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                app.error(`Team Member Info Getter`, msg)
                return [];
            });
        })
    },
    /**
     * @param {Identifier} userId 
     * @returns {Promise<ModrinthUser>}
     */
    userFor(userID) {
        return app.labrinthGetRequest(`/user/${userID}`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                app.error(`User Grabber`, msg)
                return {};
            });
        })
    },
    state: new StateManager()
}

/**
 * @typedef {string} Slug - Slug of a object on modrinth
 * @typedef {string} Version - Slug of a object on modrinth
 * @typedef {string} Identifier - Identifier of a object on modrinth
 */

await app.state.initManager();
