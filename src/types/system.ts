import type { SensorJSON } from "./sensor";

/**
 * Input data structure for instantiating the System class.
 *
 * @example
 * ```ts
 * const systemData: SystemData = {
 *   key: "system-air-quality-01",
 *   locationKey: "loc-downtown-station",
 *   manufacturerName: "Met One Instruments",
 *   modelName: "BAM 1022"
 * };
 * ```
 */
export interface SystemData {
	/** Reference to the location where this system is deployed */
	locationKey: string;

	/**
	 * Name of the system manufacturer.
	 * Defaults to 'default' if not provided during System construction.
	 */
	manufacturerName?: string;

	/**
	 * Model name or identifier of the system.
	 * Defaults to 'default' if not provided during System construction.
	 */
	modelName?: string;
}

/**
 * JSON serialization format for System objects.
 * Represents the structure returned by the System.json() method.
 */
export interface SystemJSON {
	/** Unique identifier for the system */
	key: string;

	/** Name of the system manufacturer */
	manufacturer_name: string;

	/** Model name or identifier of the system */
	model_name: string;

	/** Array of sensors associated with this system in JSON format */
	sensors: SensorJSON[];
}
