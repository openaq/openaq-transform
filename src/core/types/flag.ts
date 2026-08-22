/**
 * Input provided by the caller when adding a flag to a sensor.
 * The `sensorKey` is not required here — it is set internally by `Sensor.add`.
 *
 * @example
 * ```ts
 * const input: FlagInput = {
 *   starts: "2025-01-01T00:00:00Z",
 *   ends: "2025-01-01T01:00:00Z",
 *   flag: "error",
 *   note: "Sensor reported error code 42",
 * };
 * sensor.add(input);
 * ```
 */
export interface FlagInput {
	/**
	 * Optional custom flag key. If not provided, will be auto-generated
	 * using the pattern: `{sensorKey}-{flag}::{starts}`
	 */
	key?: string;

	/** The start datetime of the flag period as an ISO string */
	starts: string;

	/** The end datetime of the flag period as an ISO string */
	ends: string;

	/** The flag type or category name */
	flag: string;

	/** Additional notes or description for this flag */
	note: string;
}

/**
 * Complete flag data with all fields resolved, including the sensor association.
 * Constructed internally by `Sensor.add` before being passed to the `Flag` constructor.
 *
 * @example
 * ```ts
 * const flagData: FlagData = {
 *   sensorKey: "provider-location-sensor-123",
 *   starts: "2025-01-01T00:00:00Z",
 *   ends: "2025-01-01T01:00:00Z",
 *   flag: "error",
 *   note: "Sensor reported error code 42",
 * };
 * ```
 */
export interface FlagData extends FlagInput {
	/** Key of the sensor this flag applies to — always set by `Sensor.add` */
	sensorKey: string;
}

/**
 * A record type that maps flag keys to Flag instances.
 * Used for storing and retrieving Flag objects by their key.
 *
 * @example
 * ```ts
 * const flags: IndexedFlags = {
 *   "sensor-456-error::2025-01-02T00:00:00Z": new Flag({
 *     sensorKey: "sensor-456",
 *     starts: "2025-01-02T00:00:00Z",
 *     ends: "2025-01-02T02:00:00Z",
 *     flag: "error",
 *     note: "error code"
 *   })
 * };
 *
 * // Accessing a specific flag
 * const flag = flags["sensor-456-error::2025-01-02T00:00:00Z"];
 * ```
 */
//export type IndexedFlags = Record<string, Flag>;

/**
 * JSON serialization format for Flag objects.
 * Represents the structure returned by the Flag.json() method.
 *
 */
export interface FlagJSON {
	/** The key of the flag */
	key: string;

	/** The start datetime of the flag period as an ISO string */
	datetime_from: string;

	/** The end datetime of the flag period as an ISO string */
	datetime_to: string;

	/** The flag type or category name */
	flag_name: string;

	/** Additional notes or description for this flag */
	note: string;
}
