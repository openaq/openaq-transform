/**
 * Input data structure of options for instantiating the Flag class.
 *
 * @example
 * ```ts
 * const flagData: FlagData = {
 *   sensorKey: "sensor-123",
 *   starts: "2025-01-01T00:00:00Z",
 *   ends: "2025-01-01T01:00:00Z",
 *   flag: "error",
 *   note: "error code"
 * };
 * ```
 */
export interface FlagData {
	/** key of the sensor this flag applies to */
	sensorKey: string;

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
