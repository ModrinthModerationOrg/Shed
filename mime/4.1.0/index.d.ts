/**
 * An API for MIME type information.
 *
 * @author Robert Kieffer
 * @license MIT
 *
 * @module
 */
export type TypeMap = {
    [key: string]: string[];
};

export default class Mime {
    constructor(...args: TypeMap[]);

    /**
     * Define mimetype -> extension mappings. Each key is a mime-type that maps
     * to an array of extensions associated with the type. The first extension is
     * used as the default extension for the type.
     *
     * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
     *
     * If a mapping for an extension has already been defined an error will be
     * thrown unless the 'force' argument is set to 'true'.
     *
     * e.g. mime.define({'audio/wav', ['wav']}, {'audio/x-wav', ['*wav']});
     */
    define(typeMap: TypeMap, force?: boolean): this;

    /**
     * Get mime type associated with an extension
     */
    getType(path: string): string | null;

    /**
     * Get default file extension associated with a mime type
     */
    getExtension(type: string): string | null;

    /**
     * Get all file extensions associated with a mime type
     */
    getAllExtensions(type: string): Set<string> | null;

    // Private API, for internal use only. These APIs may change at any time
    _freeze(): this;
    _getTestState(): {
        types: Map<string, string>;
        extensions: Map<string, string>;
    };
}
