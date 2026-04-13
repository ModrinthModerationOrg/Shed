//#region Zip Method Imports
/** @import * as ZipJS from './index' */
/** 
 * @type { ZipJS }
 */
const { BlobReader, ZipReader, BlobWriter, ZipWriter } = await import("https://esm.sh/@zip.js/zip.js@2.8.23");

//#endregion

//#region TreeNode Type Def

/**
 * Zip tree node — extends TreeNode with blob accessor and metadata.
 * @extends {TreeNode<ZipTreeNode>}
 * @implements {ZipTreeNode}
 */
class ZipTreeNode extends TreeNode {
    /** RootZipTreeNode */
    root;
    type;
    /** @type {() => Promise<Blob|null>} */
    blob;
    /** @type {ZipJS.EntryMetaData} */
    metadata;

    /**
     * @param {RootZipTreeNode} root
     * @param {ZipTreeNode} parent
     * @param {string} name
     * @param {string} path
     * @param {(() => Promise<Blob|null>)?} blob
     * @param {("zip" | "file" | "directory")?} type
     * @param {EntryMetaData?} metadata
     */
    constructor(root, parent, name, path, blob, type, metadata) {
        super(parent, name, path);
        this.root = root;
        this.type = type ?? (blob == null ? "directory" : /\.(ear|war|jar|zip|mrpack)$/.test(name) ? "zip" : "file");
        this.blob = blob ?? (() => null);
        this.metadata = {
            ...(metadata ?? {}),
            directory: type == "directory"
        };
    }

    remove() {
        this.children.delete(this.name);

        this.root.removeNodeFromTree(segmentObject)
    };

    /**
     * @param {string} name 
     * @param {(() => Promise<Blob|null>)?} blob 
     * @param {string?} type 
     * @param {ZipJS.EntryMetaData?} metadata 
     */
    add(name, blob = null, type = null, metadata = null) {
        this.children.get(name)?.remove();
        const node = new ZipTreeNode(this.root, this, name, this.path + "/" + name, blob, type, metadata);
        this.children.set(name, node);
        this.root.addNodeToTree(node);
        return node;
    };
}

/**
 * Root tree node — extends TreeNode with a flat entries list.
 * @implements {ZipTreeNode}
 */
class RootZipTreeNode extends ZipTreeNode {
    /** @type(Map<string, ZipTreeNode>) */
    entries = new Map();

    /**
     * @param {string} name
     * @param {string} path
     */
    constructor() {
        super(null, null, "", "", null, "root", null);
    }

    /**
     * @param {ZipTreeNode} node 
     */
    addNodeToTree(node) {
        this.entries.set(node.path, node)
        return node;
    }

    /**
     * @param {ZipTreeNode} node 
     */
    removeNodeFromTree(node) {
        this.entries.set(node.path, node)
        return node;
    }
}


//#endregion

/**
 * @param {ZipTreeNode} node
 * @returns {ZipJS.FileEntry?}
 */
function fileOrNull(node) {
    return !node.metadata.directory ? node.metadata : null;
}

/**
 * @param {ZipTreeNode} node
 * @returns {ZipJS.DirectoryEntry?}
 */
function dirOrNull(node) {
    return node.metadata.directory ? node.metadata : null;
}

//#region Zip Tree Methods
/**
 * Method used to generate the zip tree of the given blob returning the root node of the entire zip file
 * @param {Blob} zipBlob
 * @returns {Promise<RootZipTreeNode>>}
 */
async function readZipTree(zipBlob) {
    const root = new RootZipTreeNode();
    return await readZipDataToNode(root, root, zipBlob, (node) => root.entries.set(node.path, node), (node) => root.entries.delete(node.path));
}

/**
 * @param {RootZipTreeNode} node
 * @returns {Blob|undefined}
 */
async function writeZipTree(node, mimeType) {
    const zip = new ZipWriter(new BlobWriter(mimeType));

    if (node.type == "directory") {
        const children = node.children
        for (const node of Object.values(children)) {
            const blob = await node.blob();
            const reader = blob != null ? new BlobReader(blob) : null;
            await zip.add(node.path, reader, node.metadata);
        }
    }
    
    return await zip.close();
}

/**
 * Method used to read the current zipBlob into the given root node which can be a root node or the root node of a new inner zip file
 * @param {RootZipTreeNode} root
 * @param {ZipTreeNode} baseNode
 * @param {Blob} zipBlob
 * @returns {Promise<TreeNode<ZipTreeNode>>}
 */
async function readZipDataToNode(rootNode, baseNode, zipBlob) {
    const zip = new ZipReader(new BlobReader(zipBlob));

    for (const entry of await zip.getEntries()) {
        const segments = entry.filename.split('/').filter(Boolean); // Remove empty strings from trailing slashes

        let currentLevel = baseNode;

        var path = "";

        for (const [index, segment] of segments.entries()) {
            path = path.length == 0 ? segment : `${path}/${segment}`;

            var segmentObject = currentLevel.children[segment];

            if (!segmentObject) {
                // Check if it's a file (last segment and not marked as a directory)
                const isFile = (index === segments.length - 1) && !entry.directory;

                segmentObject = currentLevel.add(segment, 
                    (entry.filename == path) ? async () => {
                        const buffer = await fileOrNull(segmentObject)?.arrayBuffer()
                        return buffer != null ? new Blob(buffer) : null;
                    } : null, 
                    isFile ? (/\.(ear|war|jar|zip|mrpack)$/.test(path) ? "zip" : "file") : "directory",
                    entry
                );
            }

            // Move pointer deeper into the tree if it's a directory
            if (segmentObject.type === 'directory') {
                currentLevel = segmentObject;
            } else if(segmentObject.type === 'zip' && !segmentObject.metadata.encrypted) {
                await readZipDataToNode(rootNode, segmentObject, new Blob([await fileOrNull(segmentObject)?.arrayBuffer()]), addCallback);
            }
        }
    }

    return baseNode;
}