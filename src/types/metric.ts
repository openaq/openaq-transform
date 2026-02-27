/**
 * Converter function that transforms values between units.
 *
 * @param value - The input value to convert
 * @returns The converted numeric value
 * @throws {Error} When conversion fails
 */
export type UnitConverter = (value: number | string) => number;

/**
 * Maps unit strings to their corresponding conversion functions.
 * Each converter function takes a value in the source unit and returns
 * the equivalent value in the parameter's standard unit.
 *
 * @example
 * ```ts
 * const converters: ConverterMap = {
 *   'ug/m3': (v) => +v,           // no conversion needed (standard unit)
 *   'mg/m3': (v) => +v * 1000,   // convert mg/m3 to ug/m3
 *   'ppm': (v) => +v,            // no conversion needed
 *   'ppb': (v) => +v / 1000      // convert ppb to ppm
 * };
 * ```
 */
export type ConverterMap = Record<string, UnitConverter>;

/**
 * Valid range specification for parameter values.
 * Represents [minimum, maximum] bounds for validation.
 */
export type ParameterRange = readonly [min: number, max: number];

/**
 * Defines a measurable parameter with its properties, units, and conversion capabilities.
 * Contains all metadata needed to validate, convert, and process values for a specific
 * environmental or sensor parameter.
 *
 * @example
 * ```ts
 * // Temperature parameter with Celsius and Fahrenheit support
 * const temperatureParam: Parameter = {
 *   name: 'temperature',
 *   numeric: true,
 *   units: 'c',
 *   precision: 1,
 *   range: [-50, 50],
 *   converters: {
 *     'c': (v) => +v,                           // Celsius (standard)
 *     'f': (v) => ((+v - 32) * 5) / 9          // Fahrenheit to Celsius
 *   }
 * };
 *
 * // PM2.5 concentration parameter
 * const pm25Param: Parameter = {
 *   name: 'pm25',
 *   numeric: true,
 *   units: 'ug/m3',
 *   converters: {
 *     'ug/m3': (v) => +v,        // Micrograms per cubic meter (standard)
 *     'mg/m3': (v) => +v * 1000  // Milligrams to micrograms
 *   }
 * };
 * ```
 */
export interface Parameter {
	/**
	 * Canonical name of the parameter (e.g., 'pm25', 'temperature', 'o3').
	 * Used as the standard identifier across the system.
	 */
	name: string;

	/** Whether this parameter expects numeric values */
	numeric: boolean;

	/**
	 * The standard/preferred unit for storing and reporting this parameter.
	 * All conversions will target this unit.
	 */
	units: string;

	/**
	 * Map of supported units to their conversion functions.
	 * Each function converts from the keyed unit to the standard unit.
	 */
	converters: ConverterMap;

	/**
	 * Optional valid range for parameter values as [min, max].
	 * Values outside this range will trigger validation errors.
	 */
	range?: ParameterRange;

	/**
	 * Optional decimal precision for rounding converted values.
	 */
	precision?: number;
}

/**
 * Map of parameter keys to their Parameter definitions.
 *
 * @example
 * ```ts
 * const parameters: ParameterMap = {
 *   'pm25:mass': {
 *     name: 'pm25',
 *     numeric: true,
 *     units: 'ug/m3',
 *     converters: {
 *       'ug/m3': (v) => +v,
 *       'mg/m3': (v) => +v * 1000
 *     }
 *   },
 *   'temperature': {
 *     name: 'temperature',
 *     numeric: true,
 *     units: 'c',
 *     precision: 1,
 *     range: [-50, 50],
 *     converters: {
 *       'c': (v) => +v,
 *       'f': (v) => ((+v - 32) * 5) / 9
 *     }
 *   }
 * };
 * ```
 */
export interface ParameterMap {
	/** Parameter definitions keyed by parameter identifier */
	[key: string]: Parameter;
}

/**
 * Parameter-unit pairing used for parameter specification.
 *
 * @example
 * ```ts
 * const sensorParam: ParameterUnit = {
 *   parameter: 'pm25',
 *   unit: 'ug/m3'
 * };
 * ```
 */
export interface ParameterUnit {
	/** The parameter name */
	parameter: string;

	/** The unit for this parameter */
	unit: string;
}

/**
 *
 */
export type ParameterKeyFunction = (data?: unknown) => string | number;

/**
 * Type guard to check if options are indexed reader options.
 * @param obj - The object to check
 * @returns True if obj is ParameterKeyFunction
 */
export function isParameterKeyFunction(
	value: unknown,
): value is ParameterKeyFunction {
	if (typeof value !== "function") {
		return false;
	}

	try {
		const result = value(undefined);
		return typeof result === "string" || typeof result === "number";
	} catch {
		return false;
	}
}

/**
 * Supported query languages for extracting data from structured objects.
 *
 * Currently supports JMESPath, a query language for JSON to
 * specify how to extract elements from a JSON document.
 *
 * @see {@link https://jmespath.org/specification.html JMESPath Specification}
 */
export type SupportedExpressionLanguages = "jmespath";

/**
 * A path expression using a specific query language to extract data from objects.
 *
 * @example
 * ```ts
 * // Extract a nested property using JMESPath
 * const expr: PathExpression = {
 *   type: 'jmespath',
 *   expression: 'measurements.o3.value'
 * }
 * ```
 */
export interface PathExpression {
	/** The query language used to interpret the expression */
	type: SupportedExpressionLanguages;

	/** The query expression in the specified language syntax */
	expression: string;
}

/**
 * Type guard to check if a value is a {@link PathExpression}.
 *
 * @param value - The value to check
 * @returns `true` if the value is a valid PathExpression, otherwise `false`
 *
 */
export function isPathExpression(value: unknown): value is PathExpression {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		"expression" in value &&
		typeof (value as PathExpression).type === "string" &&
		typeof (value as PathExpression).expression === "string"
	);
}

/**
 * Configuration for extracting a parameter value from client data.
 *
 * Defines how to identify and extract a specific measurement parameter from
 * the data provided by a client, along with its unit of measurement.
 *
 * @example
 * ```ts
 * // Using a string key
 * const params: ClientParameter = {
 *   parameter: 'o3',
 *   unit: 'ppm',
 *   key: 'o_3'
 * }
 *
 * // Using a path expression for nested data
 * const params: ClientParameter = {
 *   parameter: 'o3',
 *   unit: 'ppm',
 *   key: {
 *     type: 'jmespath',
 *     expression: 'measurements.o3.value'
 *   }
 * }
 *
 * // Using a custom function
 * const params: ClientParameter = {
 *   parameter: 'o3',
 *   unit: 'ppm',
 *   key: (o) => o.measurements.find(x => x.parameter === 'o3')?.value
 * }
 * ```
 */
interface ClientParameter {
	/** The name of the parameter being measured (e.g., 'o3', 'pm25') */
	parameter: string;

	/** The unit of measurement for this parameter (e.g., 'ppm', 'c', 'ug/m3') */
	unit: string;

	/**
	 * How to extract the parameter value from the client data.
	 *
	 * Can be:
	 * - A string for direct property access
	 * - A {@link PathExpression} for querying nested structures
	 * - A function for custom logic
	 */
	key: string | PathExpression | ParameterKeyFunction;
}

/**
 * Client-specific parameter configurations mapping client parameter names
 * to their corresponding ParameterUnit definitions. Used to translate between
 * client-specific naming conventions and the system's standard parameter names.
 *
 * @example
 * ```ts
 * // Default mappings for common client naming conventions
 * const clientDefaults: ClientParameters = [
 *    { parameter: 'pm25', unit: 'ugm3', key: 'pm_25' },
 *    { parameter: 'o3', unit: 'ppm', key: 'o_3' },
 *    { parameter: 'temp', unit: 'c', key: 'temperature' },
 * ];
 * ```
 */
export type ClientParameters = ClientParameter[];
