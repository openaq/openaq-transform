import debug from "debug";
import type { ErrorJSON, ErrorSummary } from "../types/errors";
import { PARAMETERS } from "./metric";

const TRANSFORM_ERROR = "TransformError";
const MEASUREMENT_ERROR = "MeasurementError";
const LOCATION_ERROR = "LocationError";
const FETCH_ERROR = "FetchError";
const PARSE_ERROR = "ParseError";

const log = debug("openaq-transform errors: DEBUG");

export class Errors {
	#errors: Map<string, TransformError[]>;

	constructor() {
		this.#errors = new Map<string, TransformError[]>();
	}

	add(err: TransformError | Error | string) {
		let type: string = "UnknownError";
		let transformError: TransformError;

		if (typeof err === "string") {
			transformError = new TransformError(err);
		} else if (err instanceof TransformError) {
			transformError = err;
			type = err.type;
		} else if (err instanceof Error) {
			transformError = new TransformError(err.message);
		} else {
			transformError = new TransformError(
				"Original error was neither a string or an error",
			);
		}

		if (!this.#errors.has(type)) {
			this.#errors.set(type, []);
		}

		this.#errors.get(type)?.push(transformError);

		log(`** ERROR (${type}):`, transformError.message);

		return transformError;
	}

	get(key: string): TransformError[] | undefined {
		return this.#errors.get(key);
	}

	has(key: string): boolean {
		return this.#errors.has(key);
	}

	get length(): number {
		let total = 0;
		for (const error of this.#errors.values()) {
			total += error.length;
		}
		return total;
	}

	summary() {
		const errorSummary: ErrorSummary = {};
		this.#errors.forEach((v, k) => {
			errorSummary[k] = v.length;
		});
		return errorSummary;
	}

	json() {
		const errorSummary: ErrorJSON = {};
		this.#errors.forEach((v, k) => {
			v.forEach((err: TransformError) => {
				const key = `${k}: ${err.message}`;
				if (!errorSummary[key]) {
					errorSummary[key] = 1;
				} else {
					errorSummary[key] += 1;
				}
			});
		});
		return errorSummary;
	}
}

export class TransformError extends RangeError {
	name: string;
	type: string;
	value?: unknown;
	flag?: string;

	constructor(message: string, value?: unknown) {
		super(`${message}. Client provided '${value}'.`);
		this.name = this.constructor.name;
		this.type = TRANSFORM_ERROR;
		this.value = value;
	}

	get strict(): boolean {
		return false;
	}
}

export class LocationError extends TransformError {
	constructor(message: string, value: unknown) {
		super(message, value);
		this.type = LOCATION_ERROR;
	}
}

export class LatitudeBoundsError extends LocationError {
	constructor(value: number) {
		super(`Latitude must be between -90 and 90 degrees.`, value);
	}
}

export class LongitudeBoundsError extends LocationError {
	constructor(value: number) {
		super("Longitude must be between -180 and 180 degrees.", value);
	}
}

export class InvalidPrecisionError extends LocationError {
	constructor(value: number, precision: number) {
		super(
			`Latitude and longitude must be precise to ${precision} decimal places.`,
			value,
		);
	}
}

class MeasurementError extends TransformError {
	constructor(message: string, value: unknown) {
		super(message, value);
		this.type = MEASUREMENT_ERROR;
	}
}

export class MissingAttributeError extends MeasurementError {
	constructor(attribute: string, value: unknown) {
		super(`Missing '${attribute}' attribute.`, JSON.stringify(value));
	}
}

// provide the parameter
// return the parameters that we do support
export class UnsupportedParameterError extends MeasurementError {
	constructor(parameter: string) {
		const supportedParameters = Object.keys(PARAMETERS)?.join(", ");
		super(
			`Parameter currently unsupported. Currently supporting ${supportedParameters}`,
			parameter,
		);
	}
}

// provide the units and the parameter
// return what units we support in that parameter
export class UnsupportedUnitsError extends MeasurementError {
	constructor(parameter: string, units: string) {
		const supportedUnits = Object.values(PARAMETERS)
			.filter((d) => d.name === parameter)
			.flatMap((d) => Object.keys(d.converters))
			.join(",");
		super(
			`Unsupported units for '${parameter}'. Currently supporting ${supportedUnits}`,
			units,
		);
	}
}

export class MissingValueError extends MeasurementError {
	constructor(value: unknown) {
		super("Value is required", value);
		//this.flag = 'MissingValue'
		this.value = null;
	}
}

// the value passed is expected to be a flag
export class ProviderValueError extends MeasurementError {
	constructor(value: unknown) {
		super("Provider flagged value", value);
		this.flag = String(value);
		this.value = null;
	}
}

export class HighValueError extends MeasurementError {
	constructor(value: number, maxValue: number) {
		super(`Value must be lower than ${maxValue}`, value);
		this.flag = "HighValue";
		// leave the value alone
	}
}

export class LowValueError extends MeasurementError {
	constructor(value: number, minValue: number) {
		super(`Value must be higher than ${minValue}`, value);
		this.flag = "LowValue";
		// leave the value alone
	}
}

/**
 * Error that occurs during data fetching (network issues, HTTP errors, etc.)
 */
export class FetchError extends TransformError {
	name: string;
	type: string;
	url: string;
	statusCode?: number;

	constructor(message: string, url: string, statusCode?: number) {
		super(message, url);
		this.name = this.constructor.name;
		this.type = FETCH_ERROR;
		this.url = url;
		this.statusCode = statusCode;
	}

	get strict(): boolean {
		// only authentication errors are strict??
		return this.statusCode === 401;
	}
}

/**
 * Error that occurs during data parsing (parser throws, invalid data format, etc.)
 */
export class ParseError extends TransformError {
	name: string;
	type: string;
	url: string;
	originalError?: Error;

	constructor(message: string, url: string, originalError?: Error) {
		super(message, url);
		this.name = this.constructor.name;
		this.type = PARSE_ERROR;
		this.url = url;
		this.originalError = originalError;
	}
}
