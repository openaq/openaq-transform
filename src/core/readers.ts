import debug from 'debug';
import type {
  BlobParser,
  JsonParser,
  Parser,
  StringParser,
} from '../types/parsers';
import {
  type DataContext,
  type IndexedReaderOptions,
  isIndexedReaderOptions,
  type RawContent,
  type ReadAs,
  type ReaderOptions,
  type UrlReaderOptions,
  type UrlReaderParameters,
} from '../types/readers';
import { FetchError, ParseError } from './errors';
import type { SourceRecord } from '../types/data';

const log = debug('openaq-transform readers: DEBUG');

export function getReaderOptions<K extends keyof IndexedReaderOptions>(
  options: ReaderOptions | IndexedReaderOptions,
  key: K,
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

// const httpFetcher = async({}) => {} // https:// or http://

// const s3Fetcher = async({}) => {} /// s3://

// const r2Fetch = async({}) => {} // rs://

// const googleStorageFetcher = async() => {} // gs://

/**
 * Merges multiple objects by concatenating arrays with matching keys.
 *
 * Used when resource.output === 'object' to combine paginated composite responses.
 * For example, merging {locations: [a,b], measurements: [1,2]} with {locations: [c], measurements: [3]}
 * produces {locations: [a,b,c], measurements: [1,2,3]}.
 *
 * Arrays with the same key are concatenated; non-array values are overwritten (last wins).
 * This enables paginated APIs that return container objects to be treated as a single logical result.
 *
 * @param objects - Array of objects to merge
 * @returns Single merged object with concatenated arrays
 */
export function mergeObjects<T = unknown>(objects: unknown[]): T {
  if (objects.length === 0) return {} as T;
  if (objects.length === 1) return objects[0] as T;

  const merged: Record<string, unknown> = {};

  for (const obj of objects) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      continue;
    }

    const record = obj as Record<string, unknown>;

    for (const key in record) {
      if (Object.hasOwn(record, key)) {
        const newValue = record[key];

        if (!(key in merged)) {
          merged[key] = newValue;
        } else if (Array.isArray(merged[key]) && Array.isArray(newValue)) {
          merged[key] = [...(merged[key] as unknown[]), ...newValue];
        } else {
          merged[key] = newValue;
        }
      }
    }
  }

  return merged as T;
}

export async function apiReader(
  params: UrlReaderParameters & { resource: { output: 'object' } },
  parser: Parser,
  data: DataContext,
): Promise<Record<string, unknown>>;

export async function apiReader(
  params: UrlReaderParameters & { resource: { output: 'array' } },
  parser: Parser,
  data: DataContext,
): Promise<unknown[]>;

export async function apiReader(
  params: UrlReaderParameters,
  parser: Parser,
  data: DataContext,
): Promise<unknown | unknown[]>;

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
 * 3. Error handling passes resource.strict flag to errorHandler:
 *    - Errors are always passed to errorHandler with the strict flag
 *    - ErrorHandler decides whether to throw based on resource and client strict modes
 *    - If no errorHandler is provided, falls back to console logging and throws if strict
 *
 * 4. Fetch and parse errors are distinguished:
 *    - Fetch errors (network, HTTP status): type='fetch', includes statusCode if available
 *    - Parse errors (parser throws): type='parse'
 *    This separation helps identify whether issues are with data retrieval or data processing.
 *
 * 5. Return type is always clean (array, object, or response), never wrapped in {data, errors}.
 *    Errors are handled by the provided errorHandler callback.
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
 * const errorHandler = (err) => console.error('Fetch error:', err);
 * const result = await apiReader({ resource, errorHandler }, async ({content}) => content, {});
 * // result: [...items from page 1, ...items from page 2]
 */ export async function apiReader(
  {
    resource,
    options = { method: 'GET' },
    concurrency = 3,
    errorHandler,
  }: UrlReaderParameters,
  parser: Parser,
  data: DataContext,
): Promise<unknown | unknown[] | Record<string, unknown>> {
  resource.data = data;

  // overrides default if needed
  const fetchOptions: UrlReaderOptions = {
    method: 'GET',
    ...options,
  };

  const urls = resource.urls;
  const results: object[] = [];
  let firstError: Error | null = null;
  log(`fetching ${resource.urls.length} URLS with concurrency ${concurrency}`);

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    await Promise.allSettled(
      batch.map(async ({ url }) => {
        let raw: RawContent;
        let readAsFormat: ReadAs | undefined;

        // Step 1: Fetch and read content
        try {
          log(`fetching ${url}...`);
          const res = await fetch(url, fetchOptions);

          if (res.status !== 200) {
            throw new FetchError(
              `${res.status} ${res.statusText}`,
              url,
              res.status,
            );
          }
          log(`fetching ${url} received HTTP 200`);

          // Determine readAs format: use resource.readAs if set, otherwise auto-detect
          readAsFormat = resource.readAs;
          if (!readAsFormat) {
            // check headers to get return method, splits at semicolon to handle charset
            // e.g. application/json; charset=utf-8
            const ctype = res.headers.get('Content-Type')?.split(';')[0];
            // fall back to json if type is not mapped
            readAsFormat = contentTypeMap.get(ctype || '');
          }

          if (readAsFormat === 'text') {
            raw = { readAs: 'text', content: await res.text() };
          } else if (readAsFormat === 'blob') {
            raw = { readAs: 'blob', content: await res.blob() };
          } else if (readAsFormat === 'json') {
            raw = { readAs: 'json', content: await res.json() };
          } else {
            raw = { readAs: 'json', content: await res.json() };
          }
        } catch (error) {
          const fetchError =
            error instanceof FetchError
              ? error
              : new FetchError(
                  error instanceof Error ? error.message : String(error),
                  url,
                );

          // Track first error for strict mode
          if (resource.strict && !firstError) {
            firstError = fetchError;
          }

          // Handle error immediately
          if (errorHandler) {
            errorHandler(fetchError, resource.strict);
          } else {
            console.error(`Reader fetch error at ${url}:`, fetchError.message);
          }
          return; // Early return on fetch error
        }

		let parsed: SourceRecord | SourceRecord[];
		try {
			let result: unknown;
			if (raw.readAs === 'text') {
				result = await (parser as StringParser)(raw.content);
			} else if (raw.readAs === 'blob') {
				result = await (parser as BlobParser)(raw.content);
			} else {
				result = await (parser as JsonParser)(raw.content);
			}

			if (!result || typeof result !== 'object') {
				throw new ParseError(`Parser returned a non-object value`, url);
			}

			parsed = result as SourceRecord | SourceRecord[];
		} catch (error) {
			const parseError = error instanceof ParseError
				? error
				: new ParseError(
					error instanceof Error ? error.message : String(error),
					url,
					error instanceof Error ? error : undefined,
				);

			if (resource.strict && !firstError) {
				firstError = parseError;
			}

			if (errorHandler) {
				errorHandler(parseError, resource.strict);
			} else {
				console.error(`Reader parse error at ${url}:`, parseError.message);
			}
			return;
		}

        // Success - combine based on output strategy
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
      }),
    );

    // If we're in strict mode and an error occurred, throw it now
    if (firstError) {
      throw firstError;
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
}
