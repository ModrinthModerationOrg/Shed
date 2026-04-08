//#region Zip Type Def
/**
 * @typedef {Object} EntryMetaData
 * @property {number} offset
 * @property {string} filename
 * @property {Uint8Array} rawFilename
 * @property {boolean} filenameUTF8
 * @property {boolean} executable
 * @property {boolean} encrypted
 * @property {boolean} zipCrypto
 * @property {number} compressedSize
 * @property {number} uncompressedSize
 * @property {Date} lastModDate
 * @property {Date} [lastAccessDate]
 * @property {Date} [creationDate]
 * @property {string} comment
 * @property {number} signature
 * @property {boolean} zip64
 * @property {number} version
 * @property {number} externalFileAttributes
 * @property {number} [unixMode]
 * @property {number} compressionMethod
 */

/**
 * @typedef {DirectoryBase & EntryMetaData} DirectoryEntry
 */

/**
 * @typedef {Object} DirectoryBase
 * @property {true} directory
 */

/**
 * @typedef {DirectoryEntry | FileEntry} Entry
 */

/**
 * @template Type
 * @callback DataWriter
 * @param {Writer<Type> | WritableWriter | WritableStream | AsyncGenerator<Writer<unknown> | WritableWriter | WritableStream, boolean>} writer
 * @param {EntryGetDataCheckPasswordOptions?} options
 * @returns {Promise<Type>}
 */

/**
 * @typedef {Object} FileBase
 * @property {false} directory
 * @property {DataWriter<Type>} getData
 * @property {(options?: EntryGetDataOptions) => Promise<ArrayBuffer>} arrayBuffer
 */

/**
 * @typedef {FileBase & EntryMetaData} FileEntry
 */

/**
 * @callback OnStart
 * @param {number} total - The total number of bytes.
 * @returns {Promise<void>|undefined}
 */

/**
 * @callback OnProgress
 * @param {number} progress - The current progress in bytes.
 * @param {number} total - The total number of bytes.
 * @returns {Promise<void>|undefined}
 */

/**
 * @callback OnEnd
 * @param {number} computedSize - The total number of bytes (computed).
 * @returns {Promise<void>|undefined}
 */

/**
 * Options for monitoring the progress of entry data processing.
 * @typedef {Object} EntryDataOnprogressOptions
 * @property {OnStart} [onstart] 
 * @property {OnProgress} [onprogress]
 * @property {OnEnd} [onend] 
 */

/**
 * Options for the ZipReader.
 * @typedef {Object} ZipReaderOptions
 * @property {boolean} [checkPasswordOnly=false] - If true, only checks the password without reading data.
 * @property {boolean} [checkSignature=false] - If true, validates the ZIP signature.
 * @property {boolean} [checkOverlappingEntry=false] - If true, checks for overlapping entries in the archive.
 * @property {boolean} [checkOverlappingEntryOnly=false] - If true, only performs the overlap check.
 * @property {string} [password] - The password used to decrypt the ZIP entries.
 * @property {boolean} [passThrough] - If true, allows data to pass through without processing.
 * @property {Uint8Array} [rawPassword] - The password provided as a raw byte array.
 * @property {AbortSignal} [signal] - An AbortSignal to cancel the reading operation.
 * @property {boolean} [preventClose=false] - If true, prevents the underlying stream from being closed automatically.
 */

/**
 * Configuration for worker behavior and stream handling.
 * @typedef {Object} WorkerConfiguration
 * @property {boolean} [useWebWorkers=true] 
 * @property {boolean} [useCompressionStream=true] 
 * @property {boolean} [transferStreams=true] 
 */

/**
 * Represents the options passed to {@link FileEntry#getData} and '{@link ZipFileEntry}.get*'.
 * @typedef {EntryDataOnprogressOptions & ZipReaderOptions & WorkerConfiguration} EntryGetDataOptions
 */

/**
 * @typedef {EntryGetDataOptions} EntryGetDataCheckPasswordOptions
 */

/**
 * An object representing a writable stream and its optional size constraints.
 * @typedef {Object} WritableWriter
 * @property {WritableStream} writable - The underlying writable stream to which data is written.
 * @property {number} [maxSize] - The maximum size (in bytes) allowed for the data. 
 * This property is optional.
 */

/**
 * Interface for objects that can be initialized asynchronously.
 * @typedef {Object} Initializable
 * @property {() => Promise<void>} [init]
 * Initializes the instance asynchronously.
 */

/**
 * Represents an instance used to write unknown type of data.
 *
 * Here is an example of custom {@link Writer} class used to write binary strings:
 * ```
 * class BinaryStringWriter extends Writer {
 *
 *   constructor() {
 *     super();
 *     this.binaryString = "";
 *   }
 *
 *   writeUint8Array(array) {
 *     for (let indexCharacter = 0; indexCharacter < array.length; indexCharacter++) {
 *       this.binaryString += String.fromCharCode(array[indexCharacter]);
 *     }
 *   }
 *
 *   getData() {
 *     return this.binaryString;
 *   }
 * }
 * ```
 * @template Type
 * @typedef {Object} Writer
 * @property {WritableStream} writable - The underlying writable stream.
 * @property {WriterInit} [init] 
 * @property {WriterWrite} writeUint8Array 
 * @property {WriterGetData<Type>} getData 
 */

/**
 * @callback WriterInit
 * @param {number} [size] - The total size of the written data in bytes.
 * @returns {Promise<void>}
 */

/**
 * @callback WriterWrite
 * @param {Uint8Array} array - The chunk data to append.
 * @returns {Promise<void>}
 */

/**
 * @template Type
 * @callback WriterGetData
 * @returns {Promise<Type>}
 */

/**
 * Represents an instance used to read a zip file.
 *
 * Here is an example showing how to read the text data of the first entry from a zip file:
 * ```
 * // create a BlobReader to read with a ZipReader the zip from a Blob object
 * const reader = new zip.ZipReader(new zip.BlobReader(blob));
 *
 * // get all entries from the zip
 * const entries = await reader.getEntries();
 * if (entries.length) {
 *
 *   // get first entry content as text by using a TextWriter
 *   const text = await entries[0].getData(
 *     // writer
 *     new zip.TextWriter(),
 *     // options
 *     {
 *       onprogress: (index, max) => {
 *         // onprogress callback
 *       }
 *     }
 *   );
 *   // text contains the entry data as a String
 *   console.log(text);
 * }
 *
 * // close the ZipReader
 * await reader.close();
 * ```
 * @typedef {Object} ZipReader
 * @property {Uint8Array} comment
 * @property {Uint8Array?} prependedData
 * @property {Uint8Array?} appendedData
 * @property {(options?: ZipReaderGetEntriesOptions) => Promise<Entry[]>} getEntries
 * @property {(options?: ZipReaderGetEntriesOptions) => AsyncGenerator<Entry, boolean>} getEntriesGenerator
 * @property {() => Promise<void>} close
 */ 

/**
 * Represents a {@link Reader} instance used to read data provided as a 'Blob' instance.
 * @typedef {Reader<Blob>} BlobReader
 */

/**
 * Represents an instance used to read unknown type of data.
 *
 * Here is an example of custom {@link Reader} class used to read binary strings:
 * ```
 * class BinaryStringReader extends Reader {
 *
 *   constructor(binaryString) {
 *     super();
 *     this.binaryString = binaryString;
 *   }
 *
 *   init() {
 *     super.init();
 *     this.size = this.binaryString.length;
 *   }
 *
 *   readUint8Array(offset, length) {
 *     const result = new Uint8Array(length);
 *     for (let indexCharacter = 0; indexCharacter < length; indexCharacter++) {
 *       result[indexCharacter] = this.binaryString.charCodeAt(indexCharacter + offset) & 0xFF;
 *     }
 *     return result;
 *   }
 * }
 * ```
 * @template Type
 * @typedef {Object} Reader
 * @property {ReadableStream} readable - The 'ReadableStream' instance.
 * @property {number} size - The total size of the data in bytes.
 * @property {ReaderInit} [init] - Initializes the instance asynchronously.
 * @property {ReaderRead} readUint8Array - Reads a specific chunk of data.
 */

/**
 * Initializes the instance asynchronously
 * @callback ReaderInit
 * @returns {Promise<void>}
 */

/**
 * Reads a chunk of data
 * @callback ReaderRead
 * @param {number} index - The byte index of the data to read.
 * @param {number} length - The length of the data to read in bytes.
 * @returns {Promise<Uint8Array>} A promise resolving to a chunk of data. 
 * The data must be truncated to the remaining size if the requested length 
 * is larger than the remaining size.
 */

/**
 * Represents an instance used to read data from a ReadableStream instance.
 * @typedef {Object} ReadableReader
 * @property {ReadableStream} readable - The ReadableStream instance.
 */
//#endregion

//#region Zip Method Imports
const { BlobReader, ZipReader } = await import("https://esm.sh/@zip.js/zip.js@2.8.23");

/** 
 * @function BlobReader 
 * @param {Blob} blob
 * @returns {BlobReader}
*/
function createBlobReader(blob) { return new BlobReader(blob) };

/** 
 * @template Type
 * @param {Reader<Type>} reader
 * @returns {ZipReader}
*/
function createZipReader(reader) { return new ZipReader(reader) };
//#endregion

//#region TreeNode Type Def
/**
 * Node entry of within a tree
 * @template {TreeNode} N
 * @typedef TreeNode
 * @property {"root"|"zip"|"file"|"directory"} type
 * @property {TreeNode?} parent
 * @property {{[key: string]: N}} children
 */

/**
 * Node entry of within a tree
 * @template {TreeNode} N
 * @typedef {TreeNode<N> & RootNodeBase<N>} RootTreeNode
 */

/**
 * Node entry of within a tree
 * @template {TreeNode} N
 * @typedef RootNodeBase
 * @property {Array<N>} entries
 */

/**
 * Node entry of within a tree
 * @typedef {TreeNode<ZipNodeBase> & ZipNodeBase} ZipTreeNode
 */

/**
 * Node entry of within a tree
 * @typedef ZipNodeBase
 * @property {string} name
 * @property {string} path
 * @property {Entry} zipEntry
 */
//#endregion

//#region Zip Tree Methods
/**
 * Method used to generate the zip tree of the given blob returning the root node of the entire zip file
 * @param {Blob} zipBlob
 * @returns {Promise<RootTreeNode<ZipTreeNode>>}
 */
async function generateZipTree(zipBlob) {
  /** @type {Array<TreeNode>} */
  const entries = [];
  /** @type {RootTreeNode<ZipTreeNode>} */
  const root = {
    type: "root",
    children: {},
    entries: entries,
  };
  await readZipDataToNode(root, zipBlob, (node) => entries.push(node))
  return root;
}

/**
 * Method used to read the current zipBlob into the given root node which can be a root node or the root node of a new inner zip file
 * @template {TreeNode} N
 * @param {TreeNode<N>} root
 * @param {Blob} zipBlob
 * @param {(TreeNode) => void} addCallback
 * @returns {TreeNode<N>}
 */
async function readZipDataToNode(root, zipBlob, addCallback) {
    const zip = createZipReader(createBlobReader(zipBlob));

    for (const entry of await zip.getEntries()) {
        const path = entry.filename;
        const segments = path.split('/').filter(Boolean); // Remove empty strings from trailing slashes

        let currentLevel = root;

        for (const [index, segment] of segments.entries()) {
            var segmentObject = currentLevel.children[segment];
            if (!segmentObject) {
                // Check if it's a file (last segment and not marked as a directory)
                const isFile = (index === segments.length - 1) && !entry.directory;

                segmentObject = /** @type {ZipTreeNode} */ {
                    parent: currentLevel,
                    children: {},
                    type: isFile ? (/\.(ear|war|jar|zip|mrpack)$/.test(path) ? "zip" : "file") : "directory",
                    name: segment,
                    path: path,
                    zipEntry: entry
                };
                addCallback(segmentObject)
                currentLevel.children[segment] = segmentObject;
            }

            // Move pointer deeper into the tree if it's a directory
            if (segmentObject.type === 'directory') {
                currentLevel = segmentObject;
            } else if(segmentObject.type === 'zip' && !segmentObject.entry.encrypted) {
                await readZipDataToNode(segmentObject, new Blob([await segmentObject.entry.arrayBuffer()]));
            }
        }
    }
}
