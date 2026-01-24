import type { JSONValue } from "@jmespath-community/jmespath";
import type { Resource } from "../core/resource";
import type { Parser } from "./parsers";
import type { ResourceKeys } from "./resource";

/**
 * Specifies how a URL resource should be read and parsed.
 * @remarks
 * - `'json'` - Parse response as JSON object
 * - `'text'` - Read response as text string
 * - `'blob'` - Read response as binary Blob
 */
export type ReadAs = "json" | "text" | "blob";

export type DataContext = JSONValue; // TODO Should be indexed

export type ErrorHandler = (err: string | Error, strict?: boolean) => void;

/**
 * Parameters for reading from a URL resource.
 * @remarks
 * Used by the API reader to fetch data from remote endpoints.
 * Supports automatic content-type detection based on response headers.
 * The readAs format is specified on the Resource object. If not specified,
 * the reader checks the Content-Type header to determine the appropriate format.
 */
export interface UrlReaderParameters {
	resource: Resource;
	/** HTTP request options for the fetch */
	options?: UrlReaderOptions;
	/** Maximum number of concurrent fetches to allows */
	concurrency?: number;
	/** Optional error handler for fetch and parse errors */
	errorHandler?: ErrorHandler;
}

/**
 * Parameters for reading from the file system.
 * @remarks
 * Used in Node.js environments for reading files from disk.
 * Not used in browser-based implementations.
 */
export interface FileSystemReaderParameters {
	resource: Resource;
	/** Optional character encoding for reading the file */
	encoding?: BufferEncoding;
	errorHandler: ErrorHandler;
}

/**
 * Union type of all possible reader parameter types.
 */
// export type ReaderParameters =
//   | UrlReaderParameters
//   | FileSystemReaderParameters
export interface ReaderParameters {
	resource: Resource;
	options?: ReaderOptions;
	errorHandler?: ErrorHandler;
}

/**
 * Reader function for URL resources.
 * @remarks
 * Returns string, Blob, or Response based on readAs option.
 * Auto-detects content type from response headers if readAs is not specified.
 * Used by the Client class when reader is set to 'api'.
 */
export type UrlReader = Reader<
	UrlReaderParameters,
	unknown | unknown[] | Record<string, unknown>
>;

/**
 * Reader function for filesystem resources.
 * @remarks
 * Always returns string content.
 * Used in Node.js environments for local file access.
 */
export type FileSystemReader = Reader<FileSystemReaderParameters, unknown>;

/**
 * Reader function for File resources.
 * @remarks
 * Always returns string content.
 * Used in Node.js environments for local file access.
 */
export type BrowserFileReader = Reader<FileReaderParameters, unknown>;

/**
 * Generic reader function that accepts any reader parameters.
 * @param params - Any valid reader parameters
 * @returns Promise resolving to Blob, string, or Response
 * @remarks
 * Used internally by the Client class to handle different resource types dynamically.
 */
export type Reader<TParams = any, TResult = unknown> = (
	params: TParams,
	parser: Parser,
	data: DataContext,
) => Promise<TResult>;

export function isReader(value: unknown): value is Reader {
	return typeof value === "function";
}

/**
 * Base interface for reader options.
 * @remarks
 * Extended by specific reader option types.
 * Retrieved using getReaderOptions() helper function in the Client class.
 */
export type ReaderOptions = {};

/**
 * Options for URL-based readers.
 * @remarks
 * Extends standard RequestInit but restricts method to GET or POST.
 * Passed to the fetch API when making HTTP requests.
 * Can include headers, credentials, and other fetch options.
 */
export interface UrlReaderOptions
	extends ReaderOptions,
		Omit<RequestInit, "method"> {
	/** HTTP method for the request. Only GET and POST are supported */
	method?: "GET" | "POST";
}

export interface FileReaderParameters {
	resource: Resource;
	encoding?: string; // 'utf8', 'utf-16', etc.
	errorHandler: ErrorHandler;
}

/**
 * Indexed collection of reader options for different data categories.
 * @template K - The keys for the indexed options (default: 'measurements' | 'locations' | 'meta')
 * @remarks
 * Used when loading multiple resources with different options per resource type.
 * The Client class uses this to configure separate options for measurements, locations, and metadata.
 * Common pattern: `{ measurements: {...}, locations: {...}, meta: {...} }`
 */
export type IndexedReaderOptions = {
	[P in ResourceKeys]?: ReaderOptions;
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
	obj: ReaderOptions | IndexedReaderOptions,
): obj is IndexedReaderOptions {
	return (
		typeof obj === "object" &&
		obj !== null &&
		("locations" in obj || "measurements" in obj || "meta" in obj)
	);
}

/**
 * Map of reader method names to their implementations.
 */
export interface ReaderMethods {
	[key: string]: Reader<any, any>;
}

/**
 * Typed map of specific reader methods.
 * @remarks
 * Provides type-safe access to common reader implementations.
 */
export type ReaderMethodMap = {
	/** Reader for API/URL resources */
	api: UrlReader;
	/** Reader for filesystem paths */
	filesystem: FileSystemReader;
	/** Additional custom readers */
	[key: string]: Reader<any, any>;
};
