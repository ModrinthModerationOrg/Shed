// #region Modrinth Application Setup

/**
 * @import {  } from "./utils.d.ts"
 */
class StateManager {
    generalValidRegex = new RegExp("https:\/\/modrinth.com\/(((project|mod|plugin|resourcepack|datapack|modpack|shader|plugin|server)\/([^\/]+)(\/)?((version(s)?|settings|gallery|changelog|moderation)(\/)?([^\/]+)?)?$)|(moderation\/technical-review((\/([^\/]+$)))?))", "m");

    prevRoute = null;
    currentRoute = null;
    project = () => null;

    async projectId() { 
        const project = this.project();

        return project != null ? project.id : null;
    }

    async getProjectFor(projectId) {
        if (this.project != null && this.project.id == projectId) return this.project;
        const project = await app.projectFor(projectId);
        if (this.url.includes("technical-review")) this.project = project
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
                        this.project = () => queryClient.getQueryData(["project", "v3", id]);
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

        router.afterEach((to, from) => {
            this.prevRoute = this.currentRoute;
            this.currentRoute = to;
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
    if (response.name == "ModrinthApiError" || response.name == "ModrinthErrorResponse") {
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
    waitForQuery(filters) {
        return new Promise(async (resolve) => {
            const cache = (await this.queryClient()).getQueryCache();

            const existingQuery = cache.find(filters);
            
            if (existingQuery && existingQuery.state.status === 'success' && !existingQuery.state.isFetching) {
                resolve(existingQuery.state.data);
            } else {
                const unsubscribe = cache.subscribe((event) => {
                    if (event.type === 'added' || event.type === 'updated') {
                        const query = event.query;
                        if (query.queryKey == filters.queryKey) {
                            if (query.state.status === 'success' && !query.state.isFetching) {
                                unsubscribe();
                                resolve(query.state.data);
                            }
                        }
                    }
                });
            }
        });
    },
    debug(title, msg, err) { this.infomUser(MessageType.DEBUG, title, msg, err); },
    info(title, msg) { this.infomUser(MessageType.INFO, title, msg); },
    success(title, msg) { this.infomUser(MessageType.SUCCESS, title, msg); },
    warn(title, msg, err) { this.infomUser(MessageType.WARN, title, msg, err); },
    error(title, msg, err) { this.infomUser(MessageType.ERROR, title, msg); },
    infomUser(type, title, msg, err) {
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

        this.notificationManager().then((manager) => {
            manager.addNotification({ title: title, text: msg, type: type.name });
        })
    },
    showDebugToast: () => false,
    request(path, requestData = {api: "labrinth", method: "GET", version: 3}) {
        this.debug("Modrinth API Request", `Running ${requestData.api} Request ${requestData.method} v${requestData.version} at path ${path}`)
        try {
            return this.client()
                .then(client => {
                    return client.request(path, requestData)
                        .then(result => {
                            this.debug("Modrinth API Request", `Value of ${requestData.api} Request ${requestData.method} v${requestData.version} at path ${path} is: ${result}`)
                            return result;
                        })
                });
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
    async projectFor(id) {
        return this.request(`/project/${id}`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`Project Info Getter`, msg)
                return { id: id }
            })
        });
    },
    projectIdFor(id) {
        return this.projectFor(id).then((project) => project.id)
    },
    projectVersionFor(projectId, versionId) {
        return this.request(`/project/${projectId}/version/${versionId}`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`Project Version Id Grabber`, msg)
                return {
                    id: versionId,
                    project_id: projectId
                };
            })
        });
    },
    projectVersionsFor(projectId) {
        return this.request(`/project/${projectId}/version`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`Id/Slug Grabber`, msg)
                return [];
            });
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
    teamFor(teamId) {
        return this.request(`/team/${teamId}/members`).then(obj => {
            return {
                teamID: teamId,
                members: validateModrinthResponse(obj, () => {
                    this.error(`Team Member Info Getter`, msg)
                    return [];
                })
            }
        })
    },
    organizationFor(organizationId) {
        return this.request(`/organization/${organizationId}`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`Team Member Info Getter`, msg)
                return [];
            });
        })
    },
    userFor(userID) {
        return this.request(`/user/${userID}`).then(obj => {
            return validateModrinthResponse(obj, (msg) => {
                this.error(`User Grabber`, msg)
                return {};
            });
        })
    },
    state: new StateManager()
}

await app.state.initManager();