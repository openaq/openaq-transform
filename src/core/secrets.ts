import type { Redacted, SecretValue } from "./types/secrets";

const SECRET_MASK = "*******";

/**
 * A wrapper class for secrets to prevent logging and leaking values
 *
 * @remarks
 * The value is held in a private field and is only available through
 * {@link Secret.reveal}. String conversion will print `*****`, and
 * `JSON.stringify` will print `{}`.
 *
 * @example
 * const apiKey = new Secret("supersecretapikey");
 * `${apiKey}`;            // "*****"
 * JSON.stringify(apiKey); // "{}"
 * apiKey.reveal();        // "supersecretapikey"
 */
export class Secret<T extends SecretValue = string> {
	readonly #value: T;

	/**
	 * @param value - The secret value to wrap.
	 */
	constructor(value: T) {
		this.#value = value;
	}

	/**
	 * Returns the secret value.
	 *
	 * @returns The revealed secret.
	 */
	reveal(): T {
		return this.#value;
	}

	/**
	 * Returns a masked value instead of the secret value.
	 *
	 * @returns The string value of SECRET_MASK`.
	 */
	toString(): string {
		return SECRET_MASK;
	}

	/**
	 * Returns a masked value so `JSON.stringify` never writes the secret.
	 * Use {@link revealSecrets} as the replacer to serialize the real value.
	 *
	 * @returns The string value of SECRET_MASK.
	 */
	toJSON(): string {
		return SECRET_MASK;
	}
}

/**
 * Wraps value in a {@link Secret} object.
 *
 * @typeParam T - The secret type.
 * @param value - The secret to wrap.
 * @returns A copy of `value` with strings wrapped in a {@link Secret}.
 *
 * @example
 * const secrets = wrapSecrets({ username: "user", password: "pass", port: 443 });
 * secrets.username.reveal(); // "user"
 * `${secrets.password}`;     // "*****"
 * `${secrets.port}`;         // "*****"
 * secrets.port.reveal();     // 443
 */
export function wrapSecrets<T>(value: T): Redacted<T> {
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return new Secret(value) as Redacted<T>;
	}
	if (Array.isArray(value)) {
		return value.map(wrapSecrets) as Redacted<T>;
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([k, v]) => [k, wrapSecrets(v)]),
		) as Redacted<T>;
	}
	return value as Redacted<T>;
}

/**
 * Returns the value of a {@link Secret}, or `value` unchanged if it is not a `Secret`.
 *
 * @example
 * reveal(new Secret("abc123")); // "abc123"
 * reveal("42");           // "42"
 */
export function reveal<T>(value: T): T extends Secret<infer V> ? V : T {
	return (value instanceof Secret ? value.reveal() : value) as T extends Secret<
		infer V
	>
		? V
		: T;
}

/**
 * A `JSON.stringify` utility function that writes the value of each
 * {@link Secret}.
 *
 * @param _key - The property key being serialized.
 * @param value - The property value being serialized.
 * @returns The revealed value for a {@link Secret}.
 *
 * @example
 * const body = { username: new Secret("user"), station: "42" };
 * JSON.stringify(body, revealSecrets); // '{"username":"user","station":"42"}'
 * JSON.stringify(body);                // '{"username":{},"station":"42"}'
 */
export function revealSecrets(
	this: unknown,
	key: string,
	value: unknown,
): unknown {
	const original = (this as Record<string, unknown>)[key];
	return original instanceof Secret ? original.reveal() : value;
}
