import { type JSONValue, search } from "@jmespath-community/jmespath";
import debug from "debug";
import type { ParseFunction } from "../types/client";
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
	asNumber: boolean = false,
) => {
	let value = null;
	if (isPathExpression(key)) {
		if (key.type === "jmespath") {
			log(`getting value from key using 'jmespath'`);
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
		log(`getting value from key using 'string'`);
		value = data ? data[key] : key;
	}
	// the csv method reads everything in as strings
	// null values should remain null and not be converted to 0
	if (value && asNumber && typeof value !== "number") {
		value = Number(value);
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
