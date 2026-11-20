import type { Secret } from "../secrets";

export type SecretValue = string | number | boolean;

/**
 * The wrapped form of a secrets object, with every string replaced by a
 * {@link Secret} at any depth.
 *
 * @remarks
 * Mirrors what {@link wrapSecrets} does at runtime. Optional properties stay
 * optional, arrays and tuples keep their shape, and non-string primitives
 * (numbers, booleans) are left unchanged.
 *
 * @typeParam T - The raw secrets shape, as defined by the client.
 *
 * @example
 * interface Secrets {
 *   username: string;
 *   password?: string;
 *   hosts: string[];
 * }
 *
 * // Redacted<Secrets> is:
 * // {
 * //   username: Secret;
 * //   password?: Secret;
 * //   hosts: Secret[];
 * // }
 */
export type Redacted<T> = T extends SecretValue
	? Secret
	: T extends object
		? { [K in keyof T]: Redacted<T[K]> }
		: T;
