import { type JSONValue, search } from "@jmespath-community/jmespath";
import { reveal, Secret } from "./secrets";
import type { PathExpression } from "./types";
import { isPathExpression } from "./types/metric";
import type { KnownParserOptions, ParserOptions } from "./types/parsers";
import type {
	DataContext,
	ReadAs,
	ReaderOptions,
	UrlReaderOptions,
} from "./types/readers";
import type {
	Auth,
	Body,
	BodyFunction,
	Context,
	ContextFunction,
	JsonBody,
	Parameters,
	ParametersFunction,
	ResourceConfig,
	ResourceOutput,
	ResourceUrl,
} from "./types/resource";
import { fillTemplate, resolve, withQueryParam } from "./utils";

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
	private _body?: Body | JsonBody | BodyFunction;

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

		switch (auth.type) {
			case "APIKey": {
				if (auth.position === "header") {
					const key = reveal(resolve(auth.key));
					const value = reveal(resolve(auth.value));
					return {
						[key]: value,
					};
				}
				if (auth.position === "cookie") {
					return { Cookie: reveal(resolve(auth.value)) };
				}
				if (auth.position === "query") {
					return {};
				}
				return {};
			}
			case "Bearer": {
				const token = auth.token ? reveal(resolve(auth.token)) : undefined;
				return token ? { Authorization: `Bearer ${token}` } : {};
			}
			case "Basic": {
				const username = reveal(resolve(auth.username));
				const password = reveal(resolve(auth.password));
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
				merged.set(key, String(reveal(resolve(value))));
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

	private buildUrl(parameters: Parameters): {
		url: string;
		displayUrl: string;
	} {
		if (!this._url) {
			throw new TypeError(
				"Cannot build URL: resource is file-based, not URL-based",
			);
		}

		const url = fillTemplate(this._url, parameters, {
			required: true,
			format: (v) => encodeURIComponent(String(reveal(v))),
		});
		const displayUrl = fillTemplate(this._url, parameters, {
			required: true,
			format: (v) => encodeURIComponent(String(v)),
		});

		try {
			return { url: new URL(url).href, displayUrl };
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new TypeError(
				`Invalid URL after template substitution: ${displayUrl}. ${message}`,
			);
		}
	}

	private resolveBody(params: Parameters): Body | JsonBody | undefined {
		if (this._body === undefined) {
			return undefined;
		}
		if (typeof this._body === "function") {
			return this._body(params, this._data);
		}
		return Resource.buildBody(this._body, params);
	}

	private static fillBody(text: string, parameters: Parameters): string {
		return fillTemplate(text, parameters, { format: (v) => String(reveal(v)) });
	}

	private static buildBody(
		body: Body | JsonBody,
		parameters: Parameters,
	): Body | JsonBody {
		if (typeof body === "string") {
			return Resource.fillBody(body, parameters);
		}

		if (body instanceof URLSearchParams) {
			const searchParams = new URLSearchParams();
			for (const [key, value] of body.entries()) {
				searchParams.append(
					Resource.fillBody(key, parameters),
					Resource.fillBody(value, parameters),
				);
			}
			return searchParams;
		}

		if (body instanceof FormData) {
			const formData = new FormData();
			for (const [key, value] of body.entries()) {
				if (typeof value === "string") {
					formData.append(
						Resource.fillBody(key, parameters),
						Resource.fillBody(value, parameters),
					);
				} else {
					formData.append(
						Resource.fillBody(key, parameters),

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
				const { url, displayUrl } = this.buildUrl(params);
				const body = this.resolveBody(params);
				const context = this.resolveContext(params);

				urls.push({
					url,
					displayUrl,
					...(body !== undefined && { body }),
					...(context && { context }),
				});
			}
		} else {
			const body = this.resolveBody({});
			const context = this.resolveContext({});

			urls.push({
				url: this._url,
				displayUrl: this._url,
				...(body !== undefined && { body }),
				...(context && { context }),
			});
		}
		const { auth } = this;

		if (auth?.type === "APIKey" && auth.position === "query") {
			const key = reveal(resolve(auth.key));
			const value = new Secret(reveal(resolve(auth.value)));
			return urls.map((resourceUrl) => ({
				...resourceUrl,
				url: withQueryParam(resourceUrl.url, key, value.reveal()),
				displayUrl: withQueryParam(resourceUrl.displayUrl, key, String(value)),
			}));
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
