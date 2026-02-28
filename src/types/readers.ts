import type { Resource } from "../core/resource";
import type { ResourceData } from "./data";
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

export type DataContext = ResourceData;

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
 * Generic reader function that fetches or reads a resource and passes the raw
 * content to a parser.
 * @template TParams - The parameter type specific to the reader implementation
 * (URL, filesystem, etc.)
 * @template TResult - The type of the parsed result returned by the reader
 * @template TParser - The parser variant accepted by this reader. Defaults to the base `Parser` union.
 *   Use `StringParser` for readers that always return text (filesystem, browser file),
 *   or `Parser` for readers that may return any content type (URL/API).
 * @param params - Reader-specific parameters (resource, options, errorHandler, etc.)
 * @param parser - Function to transform raw content into structured data. Should throw on invalid input —
 *   errors are caught and routed through the reader's errorHandler.
 * @param data - Data context passed to resource URL generation and forwarded to the parser
 * @returns Promise resolving to the parsed result
 */
export type Reader<
	// biome-ignore lint/suspicious/noExplicitAny: Default allows reader implementations with any param type
	TParams = any,
	TResult = unknown,
	TParser extends Parser = Parser,
> = (params: TParams, parser: TParser, data: DataContext) => Promise<TResult>;

export function isReader(value: unknown): value is Reader {
	return typeof value === "function";
}

/**
 * Base interface for reader options.
 * @remarks
 * Extended by specific reader option types.
 * Retrieved using getReaderOptions() helper function in the Client class.
 */
// biome-ignore lint/suspicious/noEmptyInterface: Intentional empty base type for extension by specific reader option types
export interface ReaderOptions {}

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
	// biome-ignore lint/suspicious/noExplicitAny: Reader registry must accommodate different reader implementations
	[key: string]: Reader<any, any, any>;
}

export type RawContent =
	| { readAs: "json"; content: unknown }
	| { readAs: "text"; content: string }
	| { readAs: "blob"; content: Blob };
