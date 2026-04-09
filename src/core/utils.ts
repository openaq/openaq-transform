import { type JSONValue, search } from "@jmespath-community/jmespath";
import debug from "debug";
import type { DecimalDigitGroup, ParseFunction } from "../types/client";
import type { SourceRecord } from "../types/data";
import { isPathExpression, type PathExpression } from "../types/metric";

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

export const getValueFromKey = (
	data: SourceRecord,
	key: ParseFunction | string | PathExpression,
) => {
	let value = null;
	if (isPathExpression(key)) {
		if (key.type === "jmespath") {
			log(`getting value from key using ${key.expression}`);
			value = search(data as unknown as JSONValue, key.expression);
		} else {
			throw TypeError(
				`TypeError: unsupported path expression type, supported syntaxes include: jmespath`,
			);
		}
	}
	if (typeof key === "function") {
		log(`getting value from key using 'function'`);
		try {
			value = key(data);
		} catch (error: unknown) {
			if (error instanceof TypeError) {
				throw new Error(
					`TypeError in user defined function: ${error.message}. Use optional chaining (?.) to safely access nested properties.`,
				);
			}
		}
	} else if (typeof key === "string") {
		log(`getting value from key using '${key}'`);
		value = data ? data[key] : key;
	}
	return value;
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
 * Count the number of decimal places in value
 * @returns number
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

export const getString = (
	data: SourceRecord,
	key: ParseFunction | string | PathExpression,
): string | undefined => {
	const value = getValueFromKey(data, key);
	if (value == null) return undefined;
	return String(value);
};

export const getNumber = (
	data: SourceRecord,
	key: ParseFunction | string | PathExpression,
	numberFormat: DecimalDigitGroup,
): number | undefined => {
	let value = getValueFromKey(data, key) as number | null | string;
	if (value == null || value === "") return undefined;
	if (typeof value === "string") {
		value = normalizeNumericString(value, numberFormat);
	}
	return Number.isNaN(value as number) ? undefined : (Number(value) as number);
};

export const getBoolean = (
	data: SourceRecord,
	key: ParseFunction | string | PathExpression,
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
