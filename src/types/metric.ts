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
interface ConverterMap {
  /** Unit conversion functions keyed by unit string */
  [unit: string]: UnitConverter
}

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
 * Client-specific parameter configurations mapping client parameter names 
 * to their corresponding ParameterUnit definitions. Used to translate between
 * client-specific naming conventions and the system's standard parameter names.
 * 
 * @example
 * ```ts
 * // Default mappings for common client naming conventions
 * const clientDefaults: ClientParameters = {
 *   'pm25': { parameter: 'pm_25', unit: 'ugm3' },
 *   'o3': { parameter: 'o_3', unit: 'ppm' },
 *   'temp': { parameter: 'temperature', unit: 'c' },
 *   'humidity': { parameter: 'rh', unit: '%' }
 * };
 * 
 * // Usage in client-specific data processing
 * const clientParam = clientDefaults['pm25']; // { parameter: 'pm_25', unit: 'ugm3' }
 * ```
 */
export interface ClientParameters {
  /** 
   * Client parameter configurations keyed by client-specific parameter names.
   * Values define how to map to standard parameters and units.
   */
  [key: string]: ParameterUnit;
}