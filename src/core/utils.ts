import { type JSONValue, search } from "@jmespath-community/jmespath";
import debug from "debug";
import {
	type ConstantValue,
	isConstantValue,
	isStructuredKey,
	type ParseFunction,
	type StructuredKey,
} from "../types/client";
import type { SourceRecord } from "../types/data";
import {
	type DecimalDigitGroup,
	isPathExpression,
	PATH_EXPRESSION_TYPES,
	type PathExpression,
} from "../types/metric";

const log = debug("openaq-transform utils: DEBUG");

export const stripNulls = <T extends object>(
	obj: T,
): { [K in keyof T]: T[K] } => {
	return Object.assign(
		{},
		...Object.entries(obj)
			.filter(([_, v]) => ![null, NaN, "", undefined, "undefined"].includes(v))
			.map(([k, v]) => ({ [k]: v })),
	);
};

/**
 * Extracts a value from a source record using a variety of key types.
 *
 * @param data - The source record to extract a value from.
 * @param key - Describes how to extract the value. Accepts:
 *   - `string` — used as a direct property key on `data`
 *   - `number` — returned as-is (constant passthrough)
 * 	 - `boolean` — returned as-is (constant passthrough)
 *   - `ParseFunction` — called with `data`
 *   - `ConstantValue` — the `value` attribute is returned as-is (constant passthrough)
 *   - `PathExpression` — `jmespath` query evaluated against `data`
 * @returns The extracted value, or `null` if no matching key type was found.
 * @throws {Error} If a `ParseFunction` throws a `TypeError` during execution.
 * @throws {TypeError} If a `PathExpression` has an unsupported `type`.
 */
export const getValueFromKey = (
	data: SourceRecord,
	key:
		| ParseFunction
		| string
		| number
		| boolean
		| ConstantValue
		| PathExpression,
) => {
	if (isStructuredKey(key)) {
		if (isPathExpression(key)) {
			if (key.type === "jmespath") {
				log(`getting value from key using ${key.value}`);
				const value = search(data as unknown as JSONValue, key.value);
				return value;
			}
		}
		if (isConstantValue(key)) {
			return key.value;
		}
		throw new TypeError(
			`Unsupported key type '${(key as StructuredKey).type}', supported types are: ${PATH_EXPRESSION_TYPES.join(", ")}, constant`,
		);
	}
	if (typeof key === "function") {
		log(`getting value from key using 'function'`);
		try {
			const value = key(data);
			return value;
		} catch (error: unknown) {
			if (error instanceof TypeError) {
				throw new Error(
					`TypeError in user defined function: ${error.message}. Use optional chaining (?.) to safely access nested properties.`,
				);
			}
		}
	} else if (typeof key === "string") {
		log(`getting value from key using '${key}'`);
		const value = data ? data[key] : key;
		return value;
	} else if (typeof key === "number" || typeof key === "boolean") {
		return key;
	}
	return null;
};

export const cleanKey = (value: unknown): string | undefined => {
	if (typeof value !== "string") return undefined;
	return value
		.replace(/^\s+|\s+$/g, "")
		.replace(/\s+/g, "_")
		.replace(/[^\w]/g, "")
		.toLowerCase();
};

/**
 * Counts the number of decimal places in a number.
 *
 * @param value - The number to count.
 * @returns The number of digits after the decimal point, or `0` for integers.
 *
 * @example
 * countDecimals(3.14)  // 2
 * countDecimals(100)   // 0
 * countDecimals(1.5)   // 1
 */
export function countDecimals(value: number) {
	if (Math.floor(value.valueOf()) === value.valueOf()) return 0;
	return value.toString().split(".")[1].length || 0;
}

export function formatValueForLog(value: unknown): string {
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return String(value);
	}
	if (typeof value === "function") {
		return value.name || "[Function]";
	}
	if (value === null) {
		return "null";
	}
	if (value === undefined) {
		return "undefined";
	}
	if (typeof value === "object") {
		try {
			return JSON.stringify(value);
		} catch {
			return "[object Object]";
		}
	}
	return `[${typeof value}]`;
}

/**
 * Extracts a value from a source record and coerces it to a string.
 *
 * @param data - The source record to extract a value from.
 * @param key - Key describing how to extract the value; see {@link getValueFromKey}.
 * @returns The extracted value as a string, or `undefined` if the value is `null` or `undefined`.
 */
export const getString = (
	data: SourceRecord,
	key: ParseFunction | string | ConstantValue | PathExpression,
): string | undefined => {
	const value = getValueFromKey(data, key);
	if (value == null) return undefined;
	return String(value);
};

/**
 * Extracts a value from a source record and coerces it to a number.
 *
 * String values are normalized before parsing using {@link normalizeNumericString},
 * which handles locale-specific decimal and digit-group separators.
 * Primitive `number` keys are returned as-is.
 *
 * @param data - The source record to extract a value from.
 * @param key - Key describing how to extract the value; see {@link getValueFromKey}.
 * @param numberFormat - Describes the decimal and digit-group separators used in string values.
 * @returns The extracted value as a number, or `undefined` if the value is `null`, `undefined`,
 *   an empty string, or non-numeric.
 */
export const getNumber = (
	data: SourceRecord,
	key: ParseFunction | string | number | ConstantValue | PathExpression,
	numberFormat: DecimalDigitGroup,
): number | undefined => {
	let value = getValueFromKey(data, key) as number | null | string;
	if (value == null || value === "") return undefined;
	if (typeof value === "string") {
		value = normalizeNumericString(value, numberFormat);
	}
	return Number.isNaN(value as number) ? undefined : (Number(value) as number);
};

/**
 * Extracts a value from a source record and coerces it to a boolean.
 *
 * @param data - The source record to extract a value from.
 * @param key - Key describing how to extract the value; see {@link getValueFromKey}.
 * @returns The extracted value coerced to a boolean.
 */
export const getBoolean = (
	data: SourceRecord,
	key: ParseFunction | string | boolean | ConstantValue | PathExpression,
): boolean => {
	const value = getValueFromKey(data, key);
	if (typeof value === "string") {
		const lower = value.toLowerCase().trim();
		if (lower === "false" || lower === "0") return false;
		if (lower === "true" || lower === "1") return true;
	}
	return Boolean(value);
};

/**
 * Extracts a value from a source record and returns it as an array.
 *
 * @param data - The source record to extract a value from.
 * @param key - Key describing how to extract the value; see {@link getValueFromKey}.
 * @returns The extracted value as an array of strings or numbers, or `undefined`
 *   if the value is `null`, `undefined`, or an empty string.
 */
export const getArray = (
	data: SourceRecord,
	key: ParseFunction | string | ConstantValue | PathExpression,
): (string | number)[] | undefined => {
	const value = getValueFromKey(data, key) as
		| number
		| null
		| string
		| number[]
		| string[];
	if (value == null || value === "") return undefined;
	if (!Array.isArray(value)) return [value];
	return value;
};

/**
 * Maps human-readable separator names to their corresponding Unicode
 * characters. Used to resolve decimal and digit-group separator keys in
 * {@link DecimalDigitGroup} format objects.
 *
 * @example
 * CHAR_MAP["arabic"]     // "٫"
 * CHAR_MAP["interpunct"] // "·"
 * CHAR_MAP["space"]      // " "
 */
export const CHAR_MAP: Record<string, string> = {
	point: ".",
	comma: ",",
	arabic: "\u066B", // arabic comma ٫
	apostrophe: "'",
	interpunct: "\u00B7", // interpunct/middle dot ·
	dot: ".",
	space: " ",
};

/**
 * Matches whitespace variants used as numeric digit-group separators, including
 * standard whitespace, non-breaking space (U+00A0), and narrow no-break space
 * (U+202F).
 */
const SPACE_RE = /[\s\u00A0\u202f]/g;

/**
 * Normalizes a locale-formatted numeric string into a parseable number string.
 *
 * Strips digit-group separators and replaces the decimal separator with `.`,
 * based on the provided {@link DecimalDigitGroup} format descriptor.
 *
 * @param value - The raw input string to clean (e.g. `"1.234,56"` or `"1 234.56"`).
 * @param format - Describes which characters are used as the decimal and
 * 	digit-group separators.
 * @returns A normalized numeric string with group separators removed and decimal as `.`,
 *          or an empty string if `value` is blank.
 *
 * @example
 * // Comma as decimal, period as thousands separator
 * normalizeNumericString("1.234,56", { decimal: "comma", digitGroup: "point" });
 * // => "1234.56"
 *
 * @example
 * // Space as thousands separator, comma as decimal
 * normalizeNumericString("1 234,56", { decimal: "comma", digitGroup: "space" });
 * // => "1234.56"
 *
 * @example
 * // Empty input passthrough
 * normalizeNumericString("   ", { decimal: "point", digitGroup: "comma" });
 * // => ""
 */
export function normalizeNumericString(
	value: string,
	format: DecimalDigitGroup,
): string {
	let v = value.trim();
	if (v === "") {
		return "";
	}

	const { decimal, digitGroup } = format;
	if (digitGroup) {
		if (digitGroup === "space") {
			v = v.replace(SPACE_RE, "");
		} else {
			const groupChar = CHAR_MAP[digitGroup];
			v = v.split(groupChar).join("");
		}
	}

	const decimalChar = CHAR_MAP[decimal];
	if (decimalChar !== ".") {
		v = v.split(decimalChar).join(".");
	}

	return v;
}

/**
 * Creates a JMESPath {@link PathExpression} for extracting values from source records.
 *
 * @param value - A valid JMESPath query string.
 * @returns A `PathExpression`.
 *
 * @see {@link https://jmespath.site} for JMESPath syntax reference.
 *
 * @example
 * jmespath('device.location.latitude')
 */
export function jmespath(value: string): PathExpression {
	return {
		type: "jmespath",
		value,
	};
}

/**
 * Helper function to create a {@link ConstantValue}.
 *
 * @param value - The constant string, number, or boolean to return.
 * @returns A `ConstantValue` wrapper for use anywhere a key expression is accepted.
 *
 * @example
 * constant(3600)
 * constant(true)
 * constant('metric')
 */
export function constant<T extends string | boolean | number>(
	value: T,
): ConstantValue<T> {
	return {
		type: "constant",
		value,
	};
}
