// #region Modrinth Application Setup
/**
 * @import {  } from "./utils.d.ts"
 */
class StateManager {
    generalValidRegex = new RegExp("https:\/\/modrinth.com\/(((project|mod|plugin|resourcepack|datapack|modpack|shader|plugin|server)\/([^\/]+)(\/)?((version(s)?|settings|gallery|changelog|moderation)(\/)?([^\/]+)?)?$)|(moderation\/technical-review((\/([^\/]+$)))?))", "m");

    prevRoute = null;
    currentRoute = null;
    project = () => null;

    projectId() { 
        const project = this.project();

        return project != null ? project.id : null;
    }

    async getProjectFor(projectId) {
        var project = this.project();
        if (project == null || project.id != projectId) project = await app.projectFor(projectId);
        return project;
    }

    onRouteChange(id, callback){
        const existingCallback = this.onRouteChangeCallbacks.get(id);

        if (existingCallback != null) {
            app.error("State Manager", `Unable to add new widget as it seems to share its id with another: ${id}`)
            return false;
        }

        this.onRouteChangeCallbacks.set(id, callback)

        if (this.isSetup) callback(this, this.currentRoute, this.prevRoute)
        return true;
    }

    updateElement(id) {
        const callback = this.onRouteChangeCallbacks.get(id);
        if (callback == null) return false;
        callback(this, this.currentRoute, this.prevRoute);
        return true; 
    }

    //--
    
    onRouteChangeCallbacks = new Map();

    isSetup = false;

    async initManager() {
        this.isSetup = true;

        const onRouteChange = async () => {
            setTimeout(async () => {
                if (this.currentRoute.params.id != this.prevRoute?.params?.id) {
                    const id = this.currentRoute.params.id;
                    if (id != null) {
                        // TODO: POSSIBLE SAVE THE VALUE AND INVALIDATE WHEN THE VALUE IS CHANGED
                        const queryClient = await app.queryClient();
                        const cache = await app.waitForAnyQuery({queryKey: ["project", "v3", id]}, {queryKey: ["project", id]})
                        this.project = () => queryClient.getQueryData(["project", "v3", id]) || queryClient.getQueryData(["project", id]);
                    } else {
                        this.project = () => null;
                    }
                }

                for (const hook of this.onRouteChangeCallbacks.values()) {
                    hook(this, this.currentRoute, this.prevRoute);
                }
            }, 0)
        }

        const router = (await app.router());

        var timeoutId = null;

        const setRouteChange = (to, from) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            
            this.prevRoute = this.currentRoute;
            this.currentRoute = to;
            console.log("To route: ", to)
            console.log("From route: ", from)
            onRouteChange();
        }

        router.beforeEach((to, from, next) => {
            if (to.fullPath != from.fullPath) {
                if (timeoutId == null) {
                    timeoutId = setTimeout(async () => {
                        setRouteChange(to, from)
                    }, 10)
                }
            }

            next()
        });

        router.afterEach((to, from) => {
            setRouteChange(to, from);
        });

        this.currentRoute = router.currentRoute.value;

        onRouteChange();
        
        return this;
    }
};

const MessageType = Object.freeze({
    DEBUG: { name: "debug", hex: "#0FF" },
    SUCCESS: { name: "success", hex: "#0f0" },
    INFO: { name: "warn", hex: "#FFF" },
    ERROR: { name: "error", hex: "#f00" },
    WARN: { name: "warn", hex: "#ff0" }
});

function getSlugFromURL(/*** @type {string} */ url){
    const parts = url.replace("https://", "").split('/');
    const slug = (parts[2] == 'technical-review') ? parts[3] : parts[2];
    if (slug == null) app.debug("[Modrinth Id/Slug Grabber] Could not parse slug from URL.");
    return slug;
}

function getVersionFromUrl(/*** @type {string} */ url){
    return url.replace("https://", "").split('/').pop();
}

/**  @param {ModrinthVersion} version */
function getVersionKey(version) {
    return `${version.id}/${version.version_number}`;
}

/**
 * @param {object|ModrinthApiError|Error} response 
 * @param {(error: string) => object} onError 
 */
function validateModrinthResponse(response, onError) {
    if (response.name === "ModrinthApiError" || response.name === "ModrinthServerError") {
        return onError(response);
    } else if(response.error) {
        return onError(`${response.error} - ${response.description}`);
    }
    
    return response
}

/** @type {AppWrapper} */
const app = {
    /** 
     * @private
     * @type(ModrinthApplication) 
     */
    _application: null,
    _nuxt: null,
    _context: null,
    async getNuxt() {
        if (this._nuxt == null) {
            const providers = await waitForElementValue('#__nuxt', (root) => { return root.__vue_app__?.$nuxt }, 40);
            this._nuxt = new Proxy({}, { get(_, key) { return providers[key]; } })
        }
        return this._nuxt;
    },
    async getContext() {
        if (this._context == null) {
            const providers = await waitForElementValue('#__nuxt', (root) => { return root.__vue_app__?._context }, 40);
            this._context = new Proxy({}, { get(_, key) { return providers[key]; } })
        }
        return this._context;
    },
    async getAppProviders() {
        if (this._application == null) {
            const providers = await waitForElementValue('#__nuxt', (root) => { return root._vnode?.component?.subTree?.ssContent?.component?.provides }, 40);
            this._application = new Proxy({}, { get(_, key) { return providers[Symbol.for('modrinth:' + key)]; } })
        }
        
        return this._application;
    },
    async notificationManager() { return (await this.getAppProviders()).notificationManager },
    async client() { return (await this.getAppProviders()).modrinthClient },
    async router() { return (await this.getNuxt()).$router },
    async queryClient() { return (await this.getContext()).provides.VUE_QUERY_CLIENT },
    waitForAnyQuery(...filters) { return this._waitForQuery(filters, "any"); },
    waitForAllQuery(...filters) { return this._waitForQuery(filters, "all"); },
    _waitForQuery(/** @type {Array<QueryFilters>} */ filters, /** @type {"any" | "all"} */ operation) {
        /** @type {Array<() => void>} */
        const unsubscribeCallbacks = [];
        
        return (operation == "any" ? Promise.any.bind(Promise) : Promise.all.bind(Promise))(filters.map((filter) => {
            return new Promise(async (resolve) => {
                const cache = (await this.queryClient()).getQueryCache();

                const existingQuery = cache.find(filter);
                
                if (existingQuery && existingQuery.state.status === 'success' && !existingQuery.state.isFetching) {
                    resolve(existingQuery.state.data);
                } else {
                    function arraysEqual(a, b) {
                        if (a === b) return true;
                        if (a == null || b == null || a.length !== b.length) return false;

                        for (var i = 0; i < a.length; ++i) {
                            if (a[i] !== b[i]) return false;
                        }

                        return true;
                    }

                    const unsubscribe = cache.subscribe((event) => {
                        try {
                            if (event.type === 'added' || event.type === 'updated') {
                                const query = event.query;

                                if (arraysEqual(query.queryKey, filter.queryKey)) {
                                    if (query.state.status === 'success' && !query.state.isFetching) {
                                        unsubscribeCallbacks.splice(index, 1)[0]()
                                        resolve(query.state.data);
                                    }
                                }
                            }
                        } catch (err) {
                            app.debug("Query Error", "An error has occured when trying to get data from cache!", err)
                        }
                    });

                    const index = unsubscribeCallbacks.push(unsubscribe) - 1;
                }
            });
        })).then((result) => {
            for (const callback of unsubscribeCallbacks) callback();

            return result;
        })
    },
    fetchQuery(options) {
        return this.queryClient().then(async (client) => {
            console.debug(`Fetching data from cache for '${options.queryKey}'`);
            return await client.fetchQuery(options);
        })
    },
    debug(title, msg, err, silence) { this.infomUser(MessageType.DEBUG, title, msg, err); },
    info(title, msg) { this.infomUser(MessageType.INFO, title, msg); },
    success(title, msg) { this.infomUser(MessageType.SUCCESS, title, msg); },
    warn(title, msg, err, silence) { this.infomUser(MessageType.WARN, title, msg, err, silence); },
    error(title, msg, err, silence) { this.infomUser(MessageType.ERROR, title, msg, err, silence); },
    infomUser(type, title, msg, err, silence) {
        if (type instanceof String) type = MessageType[type];
        const logMsg = [`[${title}]:`, msg];
        if (err != null) logMsg.push(err);

        if (type.name == "error") {
            console.error(...logMsg);
        } else if (type.name == "warn") {
            console.warn(...logMsg);
        } else if (type.name == "debug") {
            console.debug(...logMsg);
        } else {
            console.log(...logMsg);
        }

        if (type == MessageType.DEBUG && !this.showDebugToast()) return;

        if (!(silence ?? false)) {
            this.notificationManager().then((manager) => {
                manager.addNotification({ title: title, text: msg, type: type.name });
            })
        }
    },
    showDebugToast: () => false,
    async request(path, requestData = {api: "labrinth", method: "GET", version: 3}) {
        try {
            this.debug("Modrinth API Request", `Running ${requestData.api} Request ${requestData.method} v${requestData.version} at path ${path}`)

            const client = await this.client();

            const result = await client.request(path, requestData);

            this.debug("Modrinth API Request", `Value of ${requestData.api} Request ${requestData.method} v${requestData.version} at path ${path} is: ${result}`)
            
            return result;
        } catch (err) {
            return err;
        }
    },
    projectIdFromURl(url) {
        return this.projectFromUrl(url).then((project) => project.id)
    },
    projectFromUrl(url) {
        return this.projectFor(getSlugFromURL(url))
    },
    projectFor(id, silenceError = false) {
        return this.fetchQuery({
            queryKey: ["project", "v3", id],
            queryFn: () => this.request(`/project/${id}`),
            staleTime: 300000
        }).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`Project Info Getter`, msg, null, silenceError)
                return { id: id }
            })
        })
    },
    projectIdFor(id) {
        return this.projectFor(id).then((project) => project.id)
    },
    projectExists(id) {
        try {
            return this.projectFor(id).then(obj => obj?.name != null);
        } catch (e) {
            return Promise.resolve(false);
        }
    },
    projectVersionFor(projectId, versionId) {
        return this.fetchQuery({
            queryKey: ["project", projectId, "version", versionId, "v3"],
            queryFn: () => this.request(`/project/${projectId}/version/${versionId}`),
            staleTime: 300000
        }).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`Project Version Getter`, msg)
                return {
                    id: versionId,
                    project_id: projectId
                };
            })
        })
    },
    projectVersionsFor(projectId) {
        return this.fetchQuery({
        queryKey: ["project", projectId, "versions", "v3"],
            queryFn: () => this.request(`/project/${projectId}/version`),
            staleTime: 300000
        }).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`Project Versions Getter`, msg)
                return [];
            })
        }) 
    },
    primaryFileUrlsFor(projectId) {
        return this.projectVersionsFor(projectId).then(obj => {
            const files = [];
            for (const entry of obj) {
                files.push(entry.files[0].url);
            }
            return files;
        });
    },
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
    teamFor(teamTarget) {
        const teamId = teamTarget.team_id || teamTarget;
        const queryKey = [];

        if (teamTarget.username)          queryKey = ["user", teamTarget.id, "members"];
        else if (teamTarget.project_type) queryKey = ["project", teamTarget.id, "members"];
        else                              queryKey = ["team", teamId, "members"]

        const projectTarget = organizationTarget.organization != null;
        return this.fetchQuery({
            queryKey: queryKey,
            queryFn: () => this.request(`/team/${teamId}/members`),
            staleTime: 300000
        }).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`Team Members Info Getter`, msg)
                return [];
            })
        })
    },
    organizationFor(organizationTarget) {
        const organizationId = organizationTarget.organization || organizationTarget;
        const queryKey = [];

        if (organizationTarget.username)          queryKey = ["user", organizationTarget.id, "organization"];
        else if (organizationTarget.project_type) queryKey = ["project", organizationTarget.id, "organization"];
        else                                      queryKey = ["organization", organizationId]

        const projectTarget = organizationTarget.organization != null;
        return this.fetchQuery({
            queryKey: queryKey,
            queryFn: () => this.request(`/organization/${organizationId}`),
            staleTime: 300000
        }).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`Organization Info Getter`, msg)
                return [];
            })
        })
    },
    userFor(userID) {
        return this.fetchQuery({
            queryKey: ["user", userID],
            queryFn: () => this.request(`/user/${userID}/version`),
            staleTime: 300000
        }).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`User Info Getter`, msg)
                return [];
            })
        })
    },
    threadFor(threadTarget) {
        const threadId = threadTarget.thread_id ?? threadTarget;
        return this.fetchQuery({
            queryKey: ["thread", threadId],
            queryFn: () => this.request(`/thread/${threadId}`),
            staleTime: 300000
        }).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error("Thread Getter", error)
                return [];
            })
        })
    },
    projectsFromOwner(ownerTarget) {
        var apiPath = "";

        if (ownerTarget.team_id)       apiPath = `/organization/${ownerTarget.organization}/projects`
        else if (ownerTarget.username) apiPath = `/user/${ownerTarget.id}/projects`
        else                           apiPath = `${ownerTarget}/projects`

        return this.fetchQuery({
            queryKey: apiPath.split("/").filter((obj) => obj.length > 0),
            queryFn: () => this.request(apiPath),
            staleTime: 300000
        }).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error("Projects Owner Getter", error)
                return [];
            })
        })
    },
    state: new StateManager()
}

await app.state.initManager();