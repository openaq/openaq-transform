import { type JSONValue, search } from "@jmespath-community/jmespath";
import type { PathExpression } from "../types";
import { isPathExpression } from "../types/metric";
import type { KnownParserOptions, ParserOptions } from "../types/parsers";
import type {
	DataContext,
	ReadAs,
	ReaderOptions,
	UrlReaderOptions,
} from "../types/readers";
import type { ResourceConfig, ResourceOutput } from "../types/resource";
import {
	type Auth,
	type AuthValueFunction,
	type Body,
	type Context,
	type ContextFunction,
	isAuthValueFunction,
	type Parameters,
	type ParametersFunction,
	type ResourceUrl,
} from "../types/resource";

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
	private _file?: File | Array<File>;
	private _url?: string;
	private _parameters?: Parameters[] | ParametersFunction | PathExpression;
	private _body?: Body;
	private _data: DataContext;
	private _context?: Context | ContextFunction;
	private _responsePath?: PathExpression | string;
	private _output?: ResourceOutput;
	private _readAs?: ReadAs;
	private _strict: boolean;
	private _auth?: Auth;
	private _readerOptions?: UrlReaderOptions;
	private _parserOptions?: KnownParserOptions | ParserOptions;

	constructor(config: ResourceConfig) {
		this.validateConfig(config);
		this._file = config.file;
		this._url = config.url;
		this._parameters = config.parameters;
		this._body = config.body;
		this._context = config.context;
		this._responsePath = config.responsePath;
		this._output = config.output;
		this._readAs = config.readAs;
		this._strict = config.strict ?? false;
		this._auth = config.auth;
		this._readerOptions = config.readerOptions;
		this._parserOptions = config.parserOptions;
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
		return this._file !== undefined;
	}

	isUrlResource(): this is Resource & { url: string } {
		return this._url !== undefined;
	}

	get protocol(): string {
		const url = new URL(this.urls[0].url);
		return url.protocol;
	}

	get files(): Array<File> | undefined {
		return this._file
			? Array.isArray(this._file)
				? this._file
				: [this._file]
			: undefined;
	}

	/**
	 * Optional PathExpression used to extract nested data from an API response
	 * before processing (e.g. `"data.measurements"` for `{ data: { measurements: [...] } }`).
	 */
	get responsePath(): PathExpression | string | undefined {
		return this._responsePath;
	}

	/**
	 * Specifies how multiple URL responses should be combined.
	 * When undefined (default), returns results as-is without transformation.
	 * Set to 'array' for paginated APIs that need flattening, or 'object' for merging.
	 */
	get output(): ResourceOutput | undefined {
		return this._output;
	}

	/**
	 * Specifies how to parse HTTP responses (json/text/blob).
	 * When undefined, auto-detects from Content-Type header.
	 *
	 * Design note: Moved from reader parameter to Resource because it's a
	 * characteristic of the data source, not the reading strategy.
	 */
	get readAs(): ReadAs | undefined {
		return this._readAs;
	}

	/**
	 * When true, fails immediately on first error (development mode).
	 * When false (default), errors are handled by the provided errorHandler (production mode).
	 *
	 * Non-strict mode enables resilient data collection where partial results
	 * are still valuable even if some URLs fail.
	 */
	get strict(): boolean {
		return this._strict;
	}

	get auth(): Auth | undefined {
		return this._auth;
	}

	get authHeaders(): Record<string, string> {
		const { auth } = this;
		if (!auth) return {};

		const resolve = (v: string | AuthValueFunction) =>
			isAuthValueFunction(v) ? v() : v;

		switch (auth.type) {
			case "APIKey": {
				if (auth.position === "header") {
					return { [resolve(auth.key)]: resolve(auth.value) };
				}
				if (auth.position === "cookie") {
					return { Cookie: resolve(auth.value) };
				}
				if (auth.position === "query") {
					return {};
				}
				return {};
			}
			case "Bearer":
				if (!auth.token) return {};
				return { Authorization: `Bearer ${auth.token}` };

			case "Basic": {
				const username = resolve(auth.username);
				const password = resolve(auth.password);
				const encoded = btoa(`${username}:${password}`);
				return { Authorization: `Basic ${encoded}` };
			}

			default:
				return {};
		}
	}

	get headers(): Headers {
		const merged = new Headers();

		if (this._readerOptions?.headers) {
			for (const [key, value] of Object.entries(this._readerOptions.headers)) {
				merged.set(key, typeof value === "function" ? value() : value);
			}
		}

		for (const [key, value] of Object.entries(this.authHeaders)) {
			merged.set(key, value);
		}

		return merged;
	}

	get readerOptions(): ReaderOptions {
		return {
			...this._readerOptions,
			headers: this.headers,
		};
	}

	get parserOptions(): KnownParserOptions | ParserOptions | undefined {
		return this._parserOptions;
	}

	set auth(auth: Auth) {
		this._auth = {
			...this._auth,
			...auth,
		};
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
		if (!this._url) {
			throw new TypeError(
				"Cannot build URL: resource is file-based, not URL-based",
			);
		}
		const replaced = this._url.replace(/:(\w+)/g, (_match, key) => {
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
		this._data = JSON.parse(JSON.stringify(data));
	}

	get urls(): ResourceUrl[] {
		if (!this._url) {
			throw new TypeError(
				"Cannot get URLs: resource is file-based, not URL-based",
			);
		}

		const urls: ResourceUrl[] = [];

		if (this._parameters !== undefined) {
			const parameters = this.resolveParameters();

			for (const params of parameters) {
				const url = this.buildUrl(params);
				const body =
					this._body !== undefined
						? Resource.buildBody(this._body, params)
						: undefined;
				const context = this.resolveContext(params);

				urls.push({
					url,
					...(body && { body: body }),
					...(context && { context }),
				});
			}
		} else {
			urls.push({
				url: this._url,
				...(this._body && { body: this._body }),
				...(typeof this._context === "object" && { context: this._context }),
			});
		}
		const { auth } = this;
		if (auth?.type === "APIKey" && auth.position === "query") {
			return urls.map((resourceUrl) => {
				const url = new URL(resourceUrl.url);
				const key = typeof auth.key === "function" ? auth.key() : auth.key;
				const value =
					typeof auth.value === "function" ? auth.value() : auth.value;
				url.searchParams.set(key, value);
				return { ...resourceUrl, url: url.href };
			});
		}

		return urls;
	}

	private resolveContext(params: Parameters): Context | undefined {
		if (!this._context) return undefined;
		return typeof this._context === "function"
			? this._context(params, this._data)
			: this._context;
	}

	private resolveParameters(): Parameters[] {
		if (!this._parameters) {
			return [];
		}

		if (Array.isArray(this._parameters)) {
			return this._parameters;
		}

		if (isPathExpression(this._parameters)) {
			if (this._parameters.type === "jmespath") {
				const value = search(
					this._data as unknown as JSONValue,
					this._parameters.value,
				);
				return value as Parameters[];
			} else {
				throw TypeError(
					"TypeError: unsupported path expression type, supported syntaxes include: jmespath",
				);
			}
		}

		return this._parameters(this._data);
	}
}
