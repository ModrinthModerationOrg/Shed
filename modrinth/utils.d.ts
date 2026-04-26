declare interface ModrinthApplication {
    notificationManager: NotificationManager;
    modrinthClient: ModrinthClient;
}

declare interface NotificationManager {
    /**
     * Add notification as a toast popup to the modrinth app
     */
    addNotification({title: string, text: string, type: string}): void;
}

declare interface RequestData {
    /** 'labrinth' → api.modrinth.com, 'archon' → archon.modrinth.com, or a full URL */
    api: string; 
    /** revisionNumber (→ /v2/), 'internal' (→ /_internal/), or a string */
    version: number | string;
    /** method request type either being GET, POST, PATCH, or DELETE */
    method: string;
    /** path for the api request */
    path: string;
    /** query string params */
    params: object;
    /** request body for PATCH/POST */
    body: object;
    /** extra headers (auth is added automatically!) */
    headers: object;
    /** opt out of auto-auth useful for public endpoints */
    skipAuth: boolean;
}

declare interface ModrinthClient {
    /** Method used to send requests within modrinths API using applications client */
    request: (path: string, data: RequestData) => Promise<object | ModrinthApiError>;
}

/**
 * Base error class for all Modrinth API errors
 */
declare interface ModrinthApiError {
    statusCode?: number;
    originalError?: Error;
    responseData?: any;
    context?: string;
}

/**
 * Error class for Modrinth server errors (kyros/archon)
 * 
 * Extends ModrinthApiError with V1 error response parsing
 */
declare interface ModrinthServerError extends ModrinthApiError {
    v1Error: ModrinthErrorResponse;
}

/**
 * Modrinth V1 error response format
 * 
 * Used by kyros + archon APIs
 */
declare interface ModrinthErrorResponse {
    error: string;
    description: string;
    context?: string;
}

declare interface ModrinthProject {
    /** Title of the given project i.e. its name */
    name: string; 
    /** project id. */
    id: string; 
    /** project slug. */
    slug: string;
    /** project type */
    project_type: string; 
    /** Donation urls of the project */
    donation_urls: DonationLink[]; 
    /** Url for project issues */
    issues_url: string; 
    /** Url for project sources */
    source_url: string; 
    /** Url for project wiki */
    wiki_url: string; 
    /** Url for project discord */
    discord_url: string; 
    /** Id for the team of the project */
    team_id: string; 
    /** Id for the organization of the project */
    organization: string; 
}

interface DonationLink {
    /** id for the donation service */
    id: string; 
    /** platform name for the donation service */
    platform: string;
    /** url for the donation service */
    url: string;
}


declare interface ModrinthVersion {
    /** project id. */
    id: string; 
    /** id of the author who uploaded the file */
    author_id: string;
    /** The version number. Ideally will follow semantic versioning */
    version_number: string;
    /** Files uploaded for the given version */
    files: ModrinthVersionFile[];
}

declare interface ModrinthVersionFile {
    /** CDN url for the given file uploaded */
    url: string;
    /** Name of the upload file */
    filename: string;
}

declare interface ModrinthUser {
    /** user id */
    id: string;
    /** The user’s display name */
    name: string;
    /** The user’s username */
    username: string;
}

declare interface ModrinthOrganization {
    /** Title of the given organization i.e. its name */
    name: string;
    /** organization id. */
    id: string;
    /** organization slug. */
    slug: string;
    /** The ID of the team this organization of members is of */
    team_id: string;
    /** Members of the organization */
    members: Array<ModrinthTeamMember>;
}

declare interface ModrinthTeam {
    /** The ID of the team this team member is a member of */
    id: string;
    /** Members of the team */
    members: Array<ModrinthTeamMember>;
}

declare interface ModrinthTeamMember {
    /** The ID of the team this team member is a member of */
    id: string;
    role: string;
    is_owner: boolean;
    user: ModrinthUser;
}

declare interface OnRouteChangeCallback {
    (manager: StateManager, to: VueRoute, from?: VueRoute): void;
}

declare interface StateManager {

    prevRoute: VueRoute|null;
    currentRoute: VueRoute|null;

    project(): ModrinthProject|null;
    projectId(): string|null;

    /** Gets the current cached project for the StateManager instance if possible and the id matches or instead getting a new project */
    getProjectFor(projectId: string): Promise<ModrinthProject>;

    onRouteChange(id: string, callback: OnRouteChangeCallback): boolean;

    /** Used to update if a given element has external changes that may impact it being present or not */
    updateRegisteredCallback(id: string): boolean;

    initManager(): Promise<StateManager>;

    //--

    private onRouteChangeCallbacks: Map<string, OnRouteChangeCallback>;

    private isSetup: boolean;
}

/**
 * Enum for message types used within the {@link app.infomUser} method
 * @readonly
 * @enum {{name: string, hex: string}}
 */
declare const MessageType: {
    DEBUG: { name: string, hex: string },
    SUCCESS: { name: string, hex: string },
    INFO: { name: string, hex: string },
    ERROR: { name: string, hex: string },
    WARN: { name: string, hex: string }
}

declare type Slug = string;
declare type Version = string;
declare type Identifier = string;

/**
 * Used to validate the response from {@link AppWrapper.request} and handle the given error
 */
declare function validateModrinthResponse<T>(response: T|ModrinthApiError|Error, onError: (msg: string, error: ModrinthApiError|Error) => T): T;

declare function getVersionKey(version: ModrinthVersion): string

/**
 * A generic dictionary type used for queries and params.
 */
type RouteDictionary = { [key: string]: string | (string | null)[] | undefined };

/**
 * Represents the current active route.
 */
interface VueRoute {
    path: string;
    name?: string | symbol | null;
    hash: string;
    query: RouteDictionary;
    params: RouteDictionary;
    fullPath: string;
    matched: any[]; 
}

/**
 * Valid location formats for pushing/replacing routes.
 */
type RouteLocationRaw = string | {
    path?: string;
    name?: string;
    hash?: string;
    query?: RouteDictionary;
    params?: RouteDictionary;
};

/**
 * Navigation guards used in hooks.
 */
type NavigationGuardNext = (to?: RouteLocationRaw | false | void) => void;
type NavigationGuard = (to: VueRoute, from: VueRoute, next: NavigationGuardNext) => any;
type AfterNavigationHook = (to: VueRoute, from: VueRoute) => any;

interface RouterWrapper {
    /** The current route state. */
    currentRoute: { value: VueRoute };

    /** Programmatically navigate to a new URL by adding a history entry. */
    push(location: RouteLocationRaw): Promise<VueRoute | void>;

    /** Programmatically navigate to a new URL without adding a history entry. */
    replace(location: RouteLocationRaw): Promise<VueRoute | void>;

    /** Go forward or backward in the history stack. */
    go(delta: number): void;
    back(): void;
    forward(): void;

    /** Global Navigation Guards */
    beforeEach(guard: NavigationGuard): () => void;
    afterEach(hook: AfterNavigationHook): () => void;
    
    /** Gets all registered routes */
    getRoutes(): VueRoute[];
}

// vue-query-tm.d.ts

/**
 * A Query Key is usually an array of strings/objects, but can be a string.
 */
type QueryKey = string | readonly unknown[];

/**
 * Filters used to target specific queries in the cache.
 */
interface QueryFilters {
    queryKey?: QueryKey;
    exact?: boolean;
    type?: 'active' | 'inactive' | 'all';
    stale?: boolean;
    fetching?: boolean;
}

interface CacheEvent {
    type: 'added' | 'removed' | 'updated' | 'observerAdded' | 'observerRemoved' | 'observerResultsUpdated' | 'observerOptionsUpdated';
    query: CacheQuery;
    action?: any; 
}

/**
 * Represents an individual Query inside the cache.
 */
interface CacheQuery {
    queryKey: QueryKey;
    queryHash: string;
    state: {
        data: any;
        dataUpdateCount: number;
        dataUpdatedAt: number;
        error: any;
        errorUpdateCount: number;
        errorUpdatedAt: number;
        fetchFailureCount: number;
        fetchMeta: any;
        isFetching: boolean;
        isInvalidated: boolean;
        isPaused: boolean;
        status: 'pending' | 'success' | 'error';
    };
}

/** The internal cache structure holding all queries. */
interface QueryCache {
    find(filters: QueryFilters): CacheQuery | undefined;
    findAll(filters?: QueryFilters): CacheQuery[];
    getAll(): CacheQuery[];
    clear(): void;

    subscribe(listener: (event: CacheEvent) => void): () => void;
}

/** The main Vue Query Client wrapper for Tampermonkey access. */
interface QueryClientWrapper {
    /** Gets the raw cache object allowing deep inspection of all network state */
    getQueryCache(): QueryCache;

    /** Synchronously gets the current cached data for a specific query */
    getQueryData<TData = any>(queryKey: QueryKey): TData | undefined;

    /** Instantly updates the cache. ⚠️ WARNING: This will immediately trigger UI updates in the Vue app! */
    setQueryData<TData = any>(
        queryKey: QueryKey, 
        updater: TData | ((oldData: TData | undefined) => TData)
    ): TData;

    /** Marks queries as stale and forces the app to refetch them in the background. */
    invalidateQueries(filters?: QueryFilters): Promise<void>;

    /** Forces queries to fetch immediately, ignoring stale time. */
    refetchQueries(filters?: QueryFilters): Promise<void>;

    /** Cancels any outgoing requests for the matched queries. */
    cancelQueries(filters?: QueryFilters): Promise<void>;

    /** Removes queries entirely from the cache. */
    removeQueries(filters?: QueryFilters): void;

    fetchQuery<TData = any>(options: { 
        queryKey: QueryKey, 
        queryFn: () => Promise<TData>,
        staleTime?: number 
    }): Promise<TData>;
}

declare interface AppWrapper {
    getContext(): Promise<any>;
    getNuxt(): Promise<any>;
    getAppProviders(): Promise<ModrinthApplication>;
    notificationManager(): Promise<NotificationManager>;
    client(): Promise<ModrinthClient>;
    router(): Promise<RouterWrapper>;
    queryClient(): Promise<QueryClientWrapper>;
    waitForAnyQuery(...filters: QueryFilters[]): Promise<CacheQuery | undefined>;
    waitForAllQuery(...filters: QueryFilters[]): Promise<(CacheQuery | undefined)[]>;
    /** Send debug message to conolse and modrinth app */
    debug(title: string, msg : string|object, err?: Error): void,
    /**  Send info message to conolse and modrinth app  */
    info(title: string, msg : string|object): void,
    /** Send success message to conolse and modrinth app */
    success(title: string, msg : string|object): void,
    /** Send warn message to conolse and modrinth app */
    warn(title: string, msg : string|object, err?: Error): void,
    /** Send error message to conolse and modrinth app */
    error(title: string, msg : string|object, err?: Error): void,
    /**
     * Used to send message to the browsers console and possibly to the modrinth notification system
     * @param {MessageType|string} type - Type of message being one of the 5 possible types i.e. DEBUG, INFO, SUCCESS, WARN, ERROR
     */
    informUser(type: (keyof typeof MessageType)|typeof MessageType, title: string, msg : string|object, err?: Error): void;
    /**
     * Method used to check if the given should show debug toasts within modrinths notification system.
     * 
     * Can be replaced with custom hook.
     */
    showDebugToast: () => false,
    /**
     * Method used to send requests within modrinths API using applications client
     * 
     * @param {string} path - path for the api request
     */
    request(path: string, requestData: RequestData): Promise<object|ModrinthApiError|Error>;
    projectIdFromURl(url: string): Promise<Identifier>;
    projectFromUrl(url: string): Promise<ModrinthProject>;
    projectFor(id: Slug|Identifier, silenceError: boolean): Promise<ModrinthProject>;
    projectIdFor(id: Slug|Identifier): Promise<Identifier>;
    projectExists(id: Slug|Identifier): Promise<boolean>;
    projectVersionFor(projectId: Slug|Identifier, versionId: Version|Identifier): Promise<ModrinthVersion>;
    projectVersionsFor(projectId: Slug|Identifier): Promise<ModrinthVersion[]>;
    primaryFileUrlsFor(projectId: Slug|Identifier): Promise<String[]>;
    keyedPrimaryFileUrlsFor(projectId: Slug|Identifier): Promise<Map<string, string>>;
    teamFor(teamTarget: Identifier | ModrinthProject | ModrinthUser): Promise<ModrinthTeam>;
    organizationFor(organizationTarget: Identifier | ModrinthProject| ModrinthUser): Promise<ModrinthOrganization>;
    userFor(userID: Identifier): Promise<ModrinthUser>
    threadFor(threadTarget: Identifier | ModrinthProject): Promise<{messages: Array<{body: {type: string}, verdict: string}>}>
    projectsFromOwner(ownerTarget: ModrinthUser | ModrinthOrganization | string): Array<ModrinthProject>
    state: StateManager
}

declare const app: AppWrapper;
