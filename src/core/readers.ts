import debug from 'debug';
import {
  DataContext,
  isIndexedReaderOptions,
  UrlReaderOptions,
  UrlReaderParameters,
  type IndexedReaderOptions,
  type ReadAs,
  type ReaderOptions,
} from '../types/readers';
import { Parser } from '../types/parsers';
import { FetchError, ParseError } from './errors';
const log = debug('openaq-transform readers: DEBUG');

export function getReaderOptions<K extends keyof IndexedReaderOptions>(
  options: ReaderOptions | IndexedReaderOptions,
  key: K
): ReaderOptions {
  if (isIndexedReaderOptions(options)) {
    return options[key] ?? {};
  } else {
    return options;
  }
}

const contentTypeMap = new Map<string | null | undefined, ReadAs>([
  ['application/json', 'json'],
  ['application/ld+json', 'text'],
  ['text/plain', 'text'],
  ['text/csv', 'text'],
  ['text/zip', 'blob'],
  ['application/zip', 'blob'],
  ['application/octet-stream', 'blob'],
  [null, 'json'],
  [undefined, 'json'],
]);


const httpFetcher = async({}) => {} // https:// or http://

const s3Fetcher = async({}) => {} /// s3://

const r2Fetch = async({}) => {} // rs://

const googleStorageFetcher = async() => {} // gs://

/**
 * Merges multiple objects by concatenating arrays with matching keys.
 *
 * Used when resource.output === 'object' to combine paginated composite responses.
 * For example, merging {locations: [a,b], measurements: [1,2]} with {locations: [c], measurements: [3]}
 * produces {locations: [a,b,c], measurements: [1,2,3]}.
 *
 * Design: Arrays with the same key are concatenated; non-array values are overwritten (last wins).
 * This enables paginated APIs that return container objects to be treated as a single logical result.
 *
 * @param objects - Array of objects to merge
 * @returns Single merged object with concatenated arrays
 */
function mergeObjects(objects: object[]): object {
  if (objects.length === 0) return {};
  if (objects.length === 1) return objects[0];

  const merged: any = {};

  for (const obj of objects) {
    for (const key in obj) {
      if (!merged.hasOwnProperty(key)) {
        // First time seeing this key
        merged[key] = obj[key];
      } else if (Array.isArray(merged[key]) && Array.isArray(obj[key])) {
        // Both are arrays - concatenate
        merged[key] = [...merged[key], ...obj[key]];
      } else {
        // Not arrays or mismatched types - overwrite (last wins)
        merged[key] = obj[key];
      }
    }
  }

  return merged;
}

/**
 * Fetches data from URL-based resources with support for pagination, error handling, and flexible output formats.
 *
 * Key design decisions:
 * 1. Parser runs on each URL's content individually (inside the loop) before combining.
 *    This allows text-based parsers (CSV, XML) to process each response before aggregation.
 *
 * 2. Combining strategy is determined by resource.output (defaults to undefined for simplicity):
 *    - undefined (default): Returns responses as-is. Single URL → response; multiple URLs → array of responses
 *    - 'array': Flattens array responses, collects object responses → always returns array
 *    - 'object': Merges objects by concatenating nested arrays → always returns object
 *
 * 3. Error handling respects resource.strict:
 *    - strict=true: Throws on first error (development/debugging)
 *    - strict=false: Continues on error, stores failures in resource.errors (production)
 *
 * 4. Fetch and parse errors are distinguished:
 *    - Fetch errors (network, HTTP status): type='fetch', includes statusCode if available
 *    - Parse errors (parser throws): type='parse'
 *    This separation helps identify whether issues are with data retrieval or data processing.
 *
 * 5. Return type is always clean (array, object, or response), never wrapped in {data, errors}.
 *    Errors are accessible via resource.errors/resource.hasErrors after reading.
 *
 * @param resource - Resource configuration with URLs, output strategy, and error handling mode
 * @param parser - Function to transform raw content (text/blob/json) into structured data
 * @param data - Data context passed to both resource URL generation and parser
 * @param options - HTTP fetch options (method, headers, etc.)
 * @param concurrency - Number of URLs to fetch in parallel (default: 3)
 * @returns Response data based on resource.output strategy
 *
 * @example
 * // Default behavior: return as-is
 * const resource = new Resource({ url: 'https://api.example.com/data' });
 * const result = await apiReader({ resource }, async ({content}) => content, {});
 * // result: whatever the API returned
 *
 * @example
 * // Paginated arrays: use output='array' to flatten
 * const resource = new Resource({
 *   url: 'https://api.example.com/data?page=:page',
 *   parameters: [{page: 1}, {page: 2}],
 *   output: 'array'
 * });
 * const result = await apiReader({ resource }, async ({content}) => content, {});
 * // result: [...items from page 1, ...items from page 2]
 * if (resource.hasErrors) {
 *   const fetchErrors = resource.errors.filter(e => e.type === 'fetch');
 *   const parseErrors = resource.errors.filter(e => e.type === 'parse');
 *   console.log(`${fetchErrors.length} fetch errors, ${parseErrors.length} parse errors`);
 * }
 */
export const apiReader = async ({
  resource,
  options = { method: 'GET' },
  concurrency = 3,
}: UrlReaderParameters, parser: Parser, data: DataContext): Promise<object> => {
  resource.data = data
  // Clear any previous errors before starting
  resource.clearErrors();

  // overrides default if needed
  const fetchOptions: UrlReaderOptions = {
    method: 'GET',
    ...options,
  };

  const urls = resource.urls;
  const results: object[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(async ({ url }) => {
        let content: any;
        let readAsFormat: ReadAs | undefined;

        // Step 1: Fetch and read content
        try {
          const res = await fetch(url, fetchOptions);

          if (res.status !== 200) {
            console.log('i am about to throw an error', this)
            throw new FetchError(`${res.status} ${res.statusText}`, url, res.status);
          }

          // Determine readAs format: use resource.readAs if set, otherwise auto-detect
          readAsFormat = resource.readAs;
          if (!readAsFormat) {
            // check headers to get return method, splits at semicolon to handle charset
            // e.g. application/json; charset=utf-8
            const ctype = res.headers.get('Content-Type')?.split(';')[0];
            // fall back to json if type is not mapped
            readAsFormat = contentTypeMap.get(ctype || '');
          }

          // Read as specified format
          if (readAsFormat === 'json') {
            content = await res.json();
          } else if (readAsFormat === 'text') {
            content = await res.text();
          } else if (readAsFormat === 'blob') {
            content = await res.blob();
          } else {
            // default to json
            content = await res.json();
          }
        } catch (error) {
          // Fetch or read error
          if (resource.strict) {
            throw error;
          }
          const fetchError = error instanceof FetchError
            ? error
            : new FetchError(
                error instanceof Error ? error.message : String(error),
                url
              );
          return {
            url,
            error: fetchError.message,
            errorType: 'fetch' as const,
            statusCode: fetchError.statusCode,
          };
        }

        // Step 2: Parse content
        try {
          const parsed = await parser({ content, data });
          return { url, parsed };
        } catch (error) {
          // Parse error
          if (resource.strict) {
            throw new ParseError(
              error instanceof Error ? error.message : String(error),
              url,
              error instanceof Error ? error : undefined
            );
          }
          return {
            url,
            error: error instanceof Error ? error.message : String(error),
            errorType: 'parse' as const,
          };
        }
      })
    );

    // Process batch results
    for (const result of batchResults) {
      if (result.status === 'rejected') {
        // This should only happen in strict mode or for unexpected errors
        const error = result.reason;
        if (resource.strict) {
          throw error;
        }
        // Determine error type from the error instance
        let errorType: 'fetch' | 'parse' | undefined;
        let statusCode: number | undefined;
        let errorMessage: string;

        if (error instanceof FetchError) {
          errorType = 'fetch';
          statusCode = error.statusCode;
          errorMessage = error.message;
        } else if (error instanceof ParseError) {
          errorType = 'parse';
          errorMessage = error.message;
        } else {
          errorMessage = error instanceof Error ? error.message : String(error);
        }

        resource.addError('unknown', errorMessage, errorType, statusCode);
      } else {
        const value = result.value;
        if ('error' in value) {
          // Non-strict mode error - store on resource with type info
          resource.addError(
            value.url,
            value.error,
            value.errorType,
            value.statusCode
          );
        } else {
          // Success - combine based on output strategy
          const parsed = value.parsed;
          if (resource.output === 'array') {
            // Array output: flatten arrays, collect objects
            if (Array.isArray(parsed)) {
              // Array response - spread items into results
              results.push(...parsed);
            } else {
              // Object/primitive response - collect as-is
              results.push(parsed);
            }
          } else if (resource.output === 'object') {
            // Object output: collect objects for merging
            results.push(parsed);
          } else {
            // No output specified (default): return as-is, no transformation
            results.push(parsed);
          }
        }
      }
    }
  }

  // Handle output strategy
  if (resource.output === 'object') {
    // Merge all objects by concatenating nested arrays
    return mergeObjects(results);
  } else if (resource.output === 'array') {
    // Already flattened/collected during processing
    return results;
  } else {
    // No output specified (default): return as-is
    // Single URL returns the response directly; multiple URLs return array
    return results.length === 1 ? results[0] : results;
  }
};
