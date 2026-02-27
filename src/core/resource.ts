import { type JSONValue, search } from "@jmespath-community/jmespath";
import type { PathExpression } from "../types";
import { isPathExpression } from "../types/metric";
import type { DataContext, ReadAs } from "../types/readers";
import type { Body } from "../types/resource";

export type Parameters = Record<string, string | number | boolean>;

export type ParametersFunction = (data?: DataContext) => Parameters[];

interface ResourceUrl {
	url: string;
	body?: Body;
}

/**
 * Defines how the reader should combine responses from multiple URLs.
 *
 * - `undefined` (default): Returns results as-is without transformation.
 *   Single URL returns its response directly; multiple URLs return array of responses.
 * - `'array'`: Flattens array responses and collects object responses into an array.
 *   Use for paginated APIs where each page returns an array that should be concatenated.
 * - `'object'`: Merges object responses by concatenating arrays with matching keys.
 *   Use for paginated composite responses (e.g., {locations: [...], measurements: [...]}).
 *
 * @example
 * // Default (no output): return as-is
 * // [{id:1}] from URL 1 → [{id:1}]
 * // {a:1} from URL 1, {b:2} from URL 2 → [{a:1}, {b:2}]
 *
 * @example
 * // Array output: flatten paginated array results
 * output: 'array'
 * // [{id:1}, {id:2}] + [{id:3}] → [{id:1}, {id:2}, {id:3}]
 *
 * @example
 * // Object output: merge composite results
 * output: 'object'
 * // {stations:[a,b]} + {stations:[c]} → {stations:[a,b,c]}
 */
export type ResourceOutput = "array" | "object";

type ResourceConfig =
	| {
			url: string;
			file?: never;
			parameters?: Parameters[] | ParametersFunction | PathExpression;
			body?: Body;
			output?: ResourceOutput;
			readAs?: ReadAs;
			strict?: boolean;
	  }
	| {
			url?: never;
			file: File;
			parameters?: never;
			body?: never;
			output?: ResourceOutput;
			readAs?: ReadAs;
			strict?: boolean;
	  };

/**
 * A data source configuration for fetching and processing remote or local data.
 *
 * Accepts either a URL (with optional query parameters for pagination etc.)
 * or a File object. Once constructed, pass the resource to a reader which will
 * use it to fetch, parse, and combine responses.
 *
 * @example
 * // Basic URL resource
 * const resource = new Resource({ url: 'https://api.example.com/data' });
 *
 * @example
 * // Paginated URL resource
 * const resource = new Resource({
 *   url: 'https://api.example.com/data?page=:page',
 *   parameters: [{ page: 1 }, { page: 2 }],
 *   output: 'array',
 * });
 *
 * @example
 * // File resource
 * const resource = new Resource({ file: uploadedFile });
 */
export class Resource {
	#file?: File | Array<File>;
	#url?: string;
	#parameters?: Parameters[] | ParametersFunction | PathExpression;
	#body?: Body;
	#data: DataContext;
	#output?: ResourceOutput;
	#readAs?: ReadAs;
	#strict: boolean;

	constructor(config: ResourceConfig) {
		this.validateConfig(config);

		this.#file = config.file;
		this.#url = config.url;
		this.#parameters = config.parameters;
		this.#body = config.body;
		this.#output = config.output;
		this.#readAs = config.readAs;
		this.#strict = config.strict ?? false;
	}

	private validateConfig(config: unknown): asserts config is ResourceConfig {
		if (typeof config !== "object" || config === null) {
			throw new TypeError("Resource config must be an object");
		}

		const c = config as Record<string, unknown>;
		const hasUrl = c.url !== undefined && c.url !== null;
		const hasFile = c.file !== undefined && c.file !== null;

		if (!hasUrl && !hasFile) {
			throw new TypeError('Either "url" or "file" must be provided');
		}

		if (hasUrl && hasFile) {
			throw new TypeError(
				'Cannot provide both "url" and "file" they are mutually exclusive',
			);
		}

		if (hasFile && (c.parameters !== undefined || c.body !== undefined)) {
			throw new TypeError(
				'"parameters" and "body" can only be used with "url", not "file"',
			);
		}

		if (hasUrl && typeof c.url !== "string") {
			throw new TypeError('"url" must be a string');
		}

		if (hasFile && !(c.file instanceof File)) {
			throw new TypeError('"file" must be a File object');
		}
	}

	isFileResource(): this is Resource & { file: File } {
		return this.#file !== undefined;
	}

	isUrlResource(): this is Resource & { url: string } {
		return this.#url !== undefined;
	}

	get protocol(): string {
		const url = new URL(this.urls[0].url);
		return url.protocol;
	}

	get files(): Array<File> | undefined {
		return this.#file
			? Array.isArray(this.#file)
				? this.#file
				: [this.#file]
			: undefined;
	}

	/**
	 * Specifies how multiple URL responses should be combined.
	 * When undefined (default), returns results as-is without transformation.
	 * Set to 'array' for paginated APIs that need flattening, or 'object' for merging.
	 */
	get output(): ResourceOutput | undefined {
		return this.#output;
	}

	/**
	 * Specifies how to parse HTTP responses (json/text/blob).
	 * When undefined, auto-detects from Content-Type header.
	 *
	 * Design note: Moved from reader parameter to Resource because it's a
	 * characteristic of the data source, not the reading strategy.
	 */
	get readAs(): ReadAs | undefined {
		return this.#readAs;
	}

	/**
	 * When true, fails immediately on first error (development mode).
	 * When false (default), errors are handled by the provided errorHandler (production mode).
	 *
	 * Non-strict mode enables resilient data collection where partial results
	 * are still valuable even if some URLs fail.
	 */
	get strict(): boolean {
		return this.#strict;
	}

	private static replaceTemplateVariables(
		text: string,
		parameters: Parameters,
	): string {
		return text.replace(/:(\w+)/g, (match, key) => {
			const value = parameters[key];
			return value !== undefined ? String(value) : match;
		});
	}

	private buildUrl(parameters: Parameters): string {
		if (!this.#url) {
			throw new TypeError(
				"Cannot build URL: resource is file-based, not URL-based",
			);
		}
		const replaced = this.#url.replace(/:(\w+)/g, (_match, key) => {
			const value = parameters[key];
			if (value === undefined) {
				throw new Error(`Missing required parameter: ${key}`);
			}
			return encodeURIComponent(String(value));
		});

		try {
			const url = new URL(replaced);
			return url.href;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new TypeError(
				`Invalid URL after template substitution: ${replaced}. ${message}`,
			);
		}
	}

	private static buildBody(body: Body, parameters: Parameters): Body {
		if (typeof body === "string") {
			return Resource.replaceTemplateVariables(body, parameters);
		}

		if (body instanceof URLSearchParams) {
			const searchParams = new URLSearchParams();
			for (const [key, value] of body.entries()) {
				searchParams.append(
					Resource.replaceTemplateVariables(key, parameters),
					Resource.replaceTemplateVariables(value, parameters),
				);
			}
			return searchParams;
		}

		if (body instanceof FormData) {
			const formData = new FormData();
			for (const [key, value] of body.entries()) {
				if (typeof value === "string") {
					formData.append(
						Resource.replaceTemplateVariables(key, parameters),
						Resource.replaceTemplateVariables(value, parameters),
					);
				} else {
					formData.append(
						Resource.replaceTemplateVariables(key, parameters),
						value,
					);
				}
			}
			return formData;
		}

		if (
			body instanceof ArrayBuffer ||
			ArrayBuffer.isView(body) ||
			body instanceof ReadableStream
		) {
			return body;
		}
		return body;
	}

	set data(data: DataContext) {
		this.#data = JSON.parse(JSON.stringify(data));
	}

	get urls(): ResourceUrl[] {
		if (!this.#url) {
			throw new TypeError(
				"Cannot get URLs: resource is file-based, not URL-based",
			);
		}

		const urls: ResourceUrl[] = [];

		if (this.#parameters !== undefined) {
			const parameters = this.resolveParameters();

			for (const params of parameters) {
				const url = this.buildUrl(params);
				const body =
					this.#body !== undefined
						? Resource.buildBody(this.#body, params)
						: undefined;
				urls.push({
					url,
					...(body && { body: body }),
				});
			}
		} else {
			urls.push({
				url: this.#url,
				...(this.#body && { body: this.#body }),
			});
		}

		return urls;
	}

	private resolveParameters(): Parameters[] {
		if (!this.#parameters) {
			return [];
		}

		if (Array.isArray(this.#parameters)) {
			return this.#parameters;
		}

		if (isPathExpression(this.#parameters)) {
			if (this.#parameters.type === "jmespath") {
				const value = search(
					this.#data as unknown as JSONValue,
					this.#parameters.expression,
				);
				return value as Parameters[];
			} else {
				throw TypeError(
					"TypeError: unsupported path expression type, supported syntaxes include: jmespath",
				);
			}
		}

		return this.#parameters(this.#data);
	}
}
