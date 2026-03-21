/**
 * Tampermonkey API JSDoc Definitions
 * Based on: https://www.tampermonkey.net/documentation.php
 */

/**
 * The 'unsafeWindow' object provides full access to the pages javascript functions and variables.
 * @type {Window}
 */
declare var unsafeWindow: Window;

/**
 * An object containing information about the script and the Tampermonkey environment.
 * @type {Object}
 */
declare var GM_info: {
    script: {
        name: string;
        namespace: string;
        description: string;
        version: string;
        excludes: string[];
        includes: string[];
        matches: string[];
        resources: string[];
        runAt: string;
        grant: string[];
    };
    scriptMetaStr: string;
    scriptHandler: string;
    version: string;
    isIncognito: boolean;
};

/**
 * Creates an HTML element and appends it to the document.
 * @param {Node} [parent_node] - The parent node to append to (defaults to document.head).
 * @param {string} tag_name - The name of the HTML tag to create.
 * @param {Object} attributes - The attributes to set on the created element.
 * @returns {HTMLElement} The created element.
 */
declare function GM_addElement(parent_node?: Node, tag_name: string, attributes: Object): HTMLElement;

/**
 * Adds the given CSS to the document.
 * @param {string} css - The CSS string to inject.
 * @returns {HTMLStyleElement} The injected style element.
 */
declare function GM_addStyle(css: string): HTMLStyleElement;

/**
 * Downloads a URL to a local file.
 * @param {Object|string} details - An object with details (url, name, headers, saveAs, onload, onerror, etc.) or simply the URL to download.
 * @param {string} [name] - The name of the file (if the first parameter was a string URL).
 */
declare function GM_download(details: {
    url: string;
    name: string;
    headers?: Object;
    saveAs?: boolean;
    conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
    onload?: Function;
    onerror?: Function;
    onprogress?: Function;
    ontimeout?: Function;
} | string, name?: string): void;

/**
 * Gets the text of a predefined '@resource' tag.
 * @param {string} name - The name of the resource.
 * @returns {string} The text content of the resource.
 */
declare function GM_getResourceText(name: string): string;

/**
 * Gets the base64 encoded URI of a predefined '@resource' tag.
 * @param {string} name - The name of the resource.
 * @returns {string} The resource URL.
 */
declare function GM_getResourceURL(name: string): string;

/**
 * Logs a message to the console.
 * @param {any} message - The message or object to log.
 */
declare function GM_log(message: any): void;

/**
 * Shows a HTML5 Desktop notification and/or highlights the current tab.
 * @param {Object|string} details - A details object, or the text of the notification.
 * @param {Function|string} [ondone_or_title] - The 'ondone' callback, or the title of the notification.
 * @param {string} [image] - The URL of an image to display in the notification.
 * @param {Function} [onclick] - A callback function that will be called when the user clicks on the notification.
 */
declare function GM_notification(details: {
    text: string;
    title?: string;
    image?: string;
    highlight?: boolean;
    silent?: boolean;
    timeout?: number;
    url?: string;
    onclick?: Function;
    ondone?: Function;
} | string, ondone_or_title?: Function | string, image?: string, onclick?: Function): void;

/**
 * Opens a new tab with the given URL.
 * @param {string} url - The URL to open.
 * @param {Object|boolean} [options] - Options object (active, insert, setParent) or a boolean indicating if it should load in background.
 * @returns {Object} An object with a 'close' function, an 'onclose' listener, and a 'closed' boolean.
 */
declare function GM_openInTab(url: string, options?: {
    active?: boolean;
    insert?: boolean;
    setParent?: boolean;
} | boolean): { close: () => void, onclose: Function, closed: boolean };

/**
 * Registers a menu command to be displayed in the Tampermonkey menu.
 * @param {string} name - The name to display in the menu.
 * @param {Function} callback - The function to execute when clicked.
 * @param {Object|string} [options_or_accessKey] - Options object (e.g., 'accessKey', 'autoClose', 'title') or just the accessKey string.
 * @returns {number} The menu command ID.
 */
declare function GM_registerMenuCommand(name: string, callback: (MouseEvent: MouseEvent | KeyboardEvent) => void, options_or_accessKey?: {
    accessKey?: string;
    autoClose?: boolean;
    title?: string;
    id?: string;
} | string): number;

/**
 * Unregisters a menu command that was previously registered by 'GM_registerMenuCommand'.
 * @param {number} menuCmdId - The ID of the menu command to unregister.
 */
declare function GM_unregisterMenuCommand(menuCmdId: number): void;

/**
 * Sets the clipboard data.
 * @param {string} data - The data to place on the clipboard.
 * @param {string|Object} [info] - The MIME type (e.g., 'text/plain') or an object '{ type: 'text', mimetype: 'text/plain' }'.
 * @param {Function} [cb] - A callback function that is called when the clipboard has been set.
 */
declare function GM_setClipboard(data: string, info?: string | { type: string, mimetype: string }, cb?: Function): void;

/**
 * Gets a persistent object that is maintained as long as this tab is open.
 * @param {Function} callback - The callback receiving the tab object.
 */
declare function GM_getTab(callback: (tab: Object) => void): void;

/**
 * Saves the tab object to allow fetching it later.
 * @param {Object} tab - The tab object to save.
 * @param {Function} [cb] - Optional callback function.
 */
declare function GM_saveTab(tab: Object, cb?: Function): void;

/**
 * Gets all tab objects as a dictionary.
 * @param {Function} callback - The callback receiving the dictionary of tab objects.
 */
declare function GM_getTabs(callback: (tabs: { [key: number]: Object }) => void): void;

/**
 * Stores a value in the Tampermonkey storage.
 * @param {string} key - The key to store the value under.
 * @param {any} value - The value to store (must be JSON serializable).
 */
declare function GM_setValue(key: string, value: any): void;

/**
 * Retrieves a value from the Tampermonkey storage.
 * @param {string} key - The key to retrieve.
 * @param {any} [defaultValue] - The default value to return if the key doesn't exist.
 * @returns {any} The stored value or the default value.
 */
declare function GM_getValue(key: string, defaultValue?: any): any;

/**
 * Deletes a value from the Tampermonkey storage.
 * @param {string} key - The key to delete.
 */
declare function GM_deleteValue(key: string): void;

/**
 * Lists all keys currently in the Tampermonkey storage.
 * @returns {string[]} An array of keys.
 */
declare function GM_listValues(): string[];

/**
 * Adds a change listener to the storage that triggers when the value of the key changes.
 * @param {string} key - The key to listen for changes.
 * @param {Function} listener - Callback: '(key, old_value, new_value, remote) => void'
 * @returns {number} The listener ID.
 */
declare function GM_addValueChangeListener(key: string, listener: (key: string, old_value: any, new_value: any, remote: boolean) => void): number;

/**
 * Removes a change listener.
 * @param {number} listenerId - The ID of the listener to remove.
 */
declare function GM_removeValueChangeListener(listenerId: number): void;

/**
 * Makes an XML HTTP request, bypassing cross-origin restrictions.
 * @param {Object} details - The request details.
 * @returns {Object} An object with an 'abort' method.
 */
declare function GM_xmlhttpRequest(details: {
    method?: string;
    url: string;
    headers?: { [key: string]: string };
    data?: string | Blob | File | Object | Array<any> | FormData | URLSearchParams;
    cookie?: string;
    binary?: boolean;
    nocache?: boolean;
    revalidate?: boolean;
    timeout?: number;
    context?: any;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'stream' | 'text';
    overrideMimeType?: string;
    anonymous?: boolean;
    fetch?: boolean;
    user?: string;
    password?: string;
    onabort?: (response: Object) => void;
    onerror?: (response: Object) => void;
    onloadstart?: (response: Object) => void;
    onprogress?: (response: Object) => void;
    onreadystatechange?: (response: Object) => void;
    ontimeout?: (response: Object) => void;
    onload?: (response: Object) => void;
}): { abort: () => void };

/**
 * API for managing browser cookies.
 * @namespace GM_cookie
 */
declare var GM_cookie: {
    /**
     * Lists cookies matching the details.
     * @param {Object} details - Filter details (e.g. url, domain, name, path)
     * @param {Function} [callback] - Function receiving the array of cookies and an error string if any.
     */
    list(details: Object, callback?: (cookies: Object[], error?: string) => void): void;
    
    /**
     * Sets a cookie.
     * @param {Object} details - Cookie details (url, name, value, domain, etc.)
     * @param {Function} [callback] - Function called upon completion.
     */
    set(details: Object, callback?: (error?: string) => void): void;
    
    /**
     * Deletes a cookie.
     * @param {Object} details - Cookie details to delete (url, name, firstPartyDomain)
     * @param {Function} [callback] - Function called upon completion.
     */
    delete(details: Object, callback?: (error?: string) => void): void;
};
