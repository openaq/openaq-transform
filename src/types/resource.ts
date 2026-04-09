export const RESOURCE_KEYS = [
	"measurements",
	"locations",
	"meta",
	"flags",
	"sensors",
] as const;

export type ResourceKeys = (typeof RESOURCE_KEYS)[number];

/**
 * Special Body type for Resource.
 * @remarks
 * Extends standard BodyInit but removes the Blob type from the union.
 * Passed to the fetch API when making HTTP requests.
 */
export type Body = Exclude<BodyInit, Blob>;

export type AuthValueFunction = () => string;

export function isAuthValueFunction(
	value: string | AuthValueFunction,
): value is AuthValueFunction {
	return typeof value === "function";
}

/**
 * HTTP Basic authentication credentials.
 *
 * Credentials are base64-encoded and transmitted as an `Authorization` header
 * on every request.
 *
 * @example
 * const auth: BasicAuth = {
 *   type: 'Basic',
 *   username: 'user',
 *   password: 'foobar',
 * };
 */
type BasicAuth = {
	/** Discriminant identifying this as Basic authentication. */
	type: "Basic";

	/**
	 * The username value sent to the server.
	 * Encoded as part of the `Authorization: Basic <base64(username:password)>` header.
	 */
	username: string | AuthValueFunction;

	/**
	 * The password value associated with `username`.
	 * Encoded as part of the `Authorization: Basic <base64(username:password)>` header.
	 */
	password: string | AuthValueFunction;
};

/**
 * API key authentication configuration.
 *
 * Transmits a key/value credential via a header, query parameter,
 * or cookie. The `position` determines which fields are available
 * and how the credential is applied to the request.
 *
 * @example
 * // Header
 * const auth: ApiKeyAuth = {
 *   type: 'APIKey',
 *   position: 'header',
 *   key: 'X-API-Key',
 *   value: 'abc123',
 * };
 *
 * @example
 * // Query parameter
 * const auth: ApiKeyAuth = {
 *   type: 'APIKey',
 *   position: 'query',
 *   key: 'api_key',
 *   value: 'abc123',
 * };
 *
 * @example
 * // Cookie
 * const auth: ApiKeyAuth = {
 *   type: 'APIKey',
 *   position: 'cookie',
 *   value: 'abc123',
 * };
 */
type ApiKeyAuth = {
	/** Discriminant identifying this as API key authentication. */
	type: "APIKey";
} & (
	| {
			/**
			 * Transmits the credential as a request header or URL query parameter.
			 * Both positions require `key` to identify the header name or param name.
			 */
			position: "header" | "query";

			/**
			 * The header name or query parameter name used to transmit the credential.
			 * @example 'X-API-Key'   // header
			 * @example 'api_key'     // query parameter
			 */
			key: string | AuthValueFunction;

			/** The API key value. */
			value: string | AuthValueFunction;
	  }
	| {
			/**
			 * Indicates the the credential is set in the `Cookie` header.
			 * `key` is not required when set to `cookie` the value is written
			 * directly into the cookie header by the client.
			 */
			position: "cookie";

			/** The API key value to set as a cookie. */
			value: string | AuthValueFunction;
	  }
);

/**
 * Bearer token authentication configuration.
 *
 * @example
 * // Pending — token not yet obtained
 * const auth: BearerAuth = {
 *   type: 'Bearer',
 *   tokenUrl: 'https://example.com/oauth/token',
 * };
 *
 * @example
 * // Refreshable - token obtained, refresh supported
 * const auth: BearerAuth = {
 *   type: 'Bearer',
 *   tokenUrl: 'https://example.com/oauth/token',
 *   token: '',
 *   expiresAt: 1775600648,
 *   refreshToken: 'foobar',
 * };
 */
export type BearerAuth = {
	/** Discriminant identifying this as Bearer authentication. */
	type: "Bearer";

	/**
	 * Endpoint used to obtain or refresh the token.
	 * Also used as the refresh endpoint unless `refreshUrl` is specified.
	 */
	tokenUrl?: string;

	/**
	 * Additional headers sent when calling `tokenUrl` or `refreshUrl`.
	 * Useful for providers that require `Content-Type` or custom headers
	 * alongside the token request.
	 */
	headers?: Headers;

	/**
	 * The active bearer token, included as `Authorization: Bearer <token>`
	 * on outgoing requests. Absent until the token has been obtained
	 * from `tokenUrl`.
	 */
	token?: string | AuthValueFunction;

	/**
	 * Unix timestamp (seconds) at which `token` expires.
	 */
	expiresAt?: number;

	/**
	 * Token used to obtain a new `token` without re-authenticating.
	 */
	refreshToken?: string;

	/**
	 * Endpoint used to refresh the token, when different from `tokenUrl`.
	 * Falls back to `tokenUrl` if not specified.
	 *
	 * @example 'https://example.com/oauth/refresh'
	 */
	refreshUrl?: string;

	tokenResponseKeys?: {
		token?: string;
		expiresIn?: string;
		refreshToken?: string;
	};
};

export type Auth = BasicAuth | ApiKeyAuth | BearerAuth;
