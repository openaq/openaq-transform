/**
 * Specifies how a URL resource should be read and parsed.
 * @remarks
 * - `'json'` - Parse response as JSON object
 * - `'text'` - Read response as text string
 * - `'blob'` - Read response as binary Blob
 * - `'response'` - Return raw Response object
 */
export type ReadAs = 'json' | 'text' | 'blob' | 'response';

/**
 * Parameters for reading from a plain text string source.
 */
export interface TextReaderParameters {
  /** Discriminator for text reader type */
  type: 'text';
  /** The text content to read */
  text: string;
}

/**
 * Type guard to check if parameters are for a text reader.
 * @param params - The reader parameters to check
 * @returns True if params is TextReaderParameters
 */
export function isTextReaderParameters(params: ReaderParameters): params is TextReaderParameters {
  return 'type' in params && params.type === 'text';
}

/**
 * Parameters for reading from a URL resource.
 * @remarks
 * Used by the API reader to fetch data from remote endpoints.
 * Supports automatic content-type detection based on response headers.
 * If readAs is not specified, the reader checks the Content-Type header to determine the appropriate format.
 */
export interface UrlReaderParameters {
  /** Discriminator for URL reader type */
  type: 'url';
  /** The URL to fetch data from */
  resource: string;
  /** How to parse the response data. If omitted, auto-detected from Content-Type header */
  readAs?: ReadAs;
  /** HTTP request options for the fetch */
  options: UrlReaderOptions;
}

/**
 * Type guard to check if parameters are for a URL reader.
 * @param params - The reader parameters to check
 * @returns True if params is UrlReaderParameters
 */
export function isUrlReaderParameters(params: ReaderParameters): params is UrlReaderParameters {
  return 'type' in params && params.type === 'url';
}

/**
 * Parameters for reading from a Blob object.
 * @remarks
 * Commonly used for reading uploaded files in browser environments.
 * The file reader uses FileReader API to convert the Blob to a text string.
 */
export interface BlobReaderParameters {
  /** Discriminator for blob reader type */
  type: 'blob';
  /** The Blob object to read */
  resource: Blob;
}

/**
 * Type guard to check if parameters are for a blob reader.
 * @param params - The reader parameters to check
 * @returns True if params is BlobReaderParameters
 */
export function isBlobReaderParameters(params: ReaderParameters): params is BlobReaderParameters {
  return 'type' in params && params.type === 'blob';
}

/**
 * Parameters for reading from the file system.
 * @remarks
 * Used in Node.js environments for reading files from disk.
 * Not used in browser-based implementations.
 */
export interface FileSystemReaderParameters {
  /** Discriminator for filesystem reader type */
  type: 'filesystem';
  /** The file path from which to read */
  path: string;
  /** Optional character encoding for reading the file */
  encoding?: BufferEncoding;
}

/**
 * Type guard to check if parameters are for a filesystem reader.
 * @param params - The reader parameters to check
 * @returns True if params is FileSystemReaderParameters
 */
export function isFileSystemReaderParameters(params: ReaderParameters): params is FileSystemReaderParameters {
  return 'type' in params && params.type === 'filesystem';
}

/**
 * Union type of all possible reader parameter types.
 */
export type ReaderParameters =
  | UrlReaderParameters
  | BlobReaderParameters
  | FileSystemReaderParameters
  | TextReaderParameters;

/**
 * Generic typed reader function interface.
 * @template TParams - The specific reader parameters type
 * @template TResult - The return type of the reader (default: string | Blob | Response)
 * @remarks
 * All readers follow this pattern: accept typed parameters and return a Promise of the read data.
 */
export interface TypedReader<TParams extends ReaderParameters, TResult = string | Blob | Response> {
  /**
   * Reads data using the provided parameters.
   * @param params - The reader-specific parameters
   * @returns Promise resolving to the read data
   */
  (params: TParams): Promise<TResult>;
}

/**
 * Reader function for URL resources.
 * @remarks 
 * Returns string, Blob, or Response based on readAs option.
 * Auto-detects content type from response headers if readAs is not specified.
 * Used by the Client class when reader is set to 'api'.
 */
export type UrlReader = TypedReader<UrlReaderParameters>;

/**
 * Reader function for Blob objects.
 * @remarks 
 * Always returns string representation using FileReader API.
 * Commonly used for uploaded files in browser environments.
 * Used by the Client class when reader is set to 'file'.
 */
export type BlobReader = TypedReader<BlobReaderParameters, string>;

/**
 * Reader function for filesystem resources.
 * @remarks 
 * Always returns string content.
 * Used in Node.js environments for local file access.
 */
export type FileSystemReader = TypedReader<FileSystemReaderParameters, string>;

/**
 * Reader function for plain text strings.
 * @remarks 
 * Always returns the input string wrapped in a Promise.
 * Useful for testing or when data is already in memory.
 * Used by the Client class when reader is set to 'text'.
 */
export type TextReader = TypedReader<TextReaderParameters, string>;

/**
 * Generic reader function that accepts any reader parameters.
 * @param params - Any valid reader parameters
 * @returns Promise resolving to Blob, string, or Response
 * @remarks
 * Used internally by the Client class to handle different resource types dynamically.
 */
export type Reader = (
  params: ReaderParameters
) => Promise<Blob | string | Response>;

/**
 * Base interface for reader options.
 * @remarks 
 * Extended by specific reader option types.
 * Retrieved using getReaderOptions() helper function in the Client class.
 */
export interface ReaderOptions {}

/**
 * Options for URL-based readers.
 * @remarks 
 * Extends standard RequestInit but restricts method to GET or POST.
 * Passed to the fetch API when making HTTP requests.
 * Can include headers, credentials, and other fetch options.
 */
export interface UrlReaderOptions extends ReaderOptions, Omit<RequestInit, 'method'> {
  /** HTTP method for the request. Only GET and POST are supported */
  method: 'GET' | 'POST';
}

/**
 * Indexed collection of reader options for different data categories.
 * @template K - The keys for the indexed options (default: 'measurements' | 'locations' | 'meta')
 * @remarks
 * Used when loading multiple resources with different options per resource type.
 * The Client class uses this to configure separate options for measurements, locations, and metadata.
 * Common pattern: `{ measurements: {...}, locations: {...}, meta: {...} }`
 */
export type IndexedReaderOptions<K extends string = 'measurements' | 'locations' | 'meta'> = {
  [P in K]?: ReaderOptions;
};

/**
 * Type guard to check if options are indexed reader options.
 * @param obj - The options object to check
 * @returns True if obj is IndexedReaderOptions
 * @remarks
 * Used by getReaderOptions() to determine whether to extract key-specific options
 * or return the flat options object.
 */
export function isIndexedReaderOptions(
  obj: ReaderOptions | IndexedReaderOptions
): obj is IndexedReaderOptions {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('locations' in obj || 'measurements' in obj || 'meta' in obj)
  );
}

/**
 * Map of reader method names to their implementations.
 */
export interface ReaderMethods {
  [key: string]: (params: any) => Promise<Blob | string | Response >;
}

/**
 * Typed map of specific reader methods.
 * @remarks 
 * Provides type-safe access to common reader implementations.
 */
export type ReaderMethodMap = {
  /** Reader for API/URL resources */
  api: UrlReader;
  /** Reader for file Blobs */
  file: BlobReader;
  /** Reader for plain text */
  text: TextReader;
  /** Reader for filesystem paths */
  filesystem: FileSystemReader;
  /** Additional custom readers */
  [key: string]: TypedReader<any, any>;
}
