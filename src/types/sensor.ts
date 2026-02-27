import type { Metric } from "../core/metric";
import type { FlagJSON } from "./flag";
import type { ParameterUnit } from "./metric";

/**
 * Represents options for instantiating the Sensor class.
 *
 * @example
 * ```ts
 * // With Metric instance
 * const sensorData: SensorData = {
 *   key: "sensor-temp-01",
 *   systemKey: "system-temp",
 *   metric: new Metric("temperature", "celsius"),
 *   averagingIntervalSeconds: 3600,
 *   loggingIntervalSeconds: 3600,
 *   status: "active",
 *   versionDate: "2025-01-01",
 *   instance: ""
 * };
 *
 */
export interface SensorData {
	/** key for the system this sensor belongs to */
	systemKey: string;

	/**
	 * Metric configuration - can be either a Metric instance or ParameterUnit object.
	 * If ParameterUnit is provided, it will be converted to a Metric instance during construction.
	 */
	metric: Metric | ParameterUnit;

	/** Time interval in seconds over which sensor values are averaged */
	averagingIntervalSeconds?: number;

	/** Time interval in seconds at which sensor data is logged. Defaults to averagingIntervalSeconds if not provided */
	loggingIntervalSeconds?: number;

	/** Current operational status of the sensor (e.g., "active", "inactive", "calibrating") */
	status?: string;

	/** Optional version date indicating when this sensor configuration was last updated */
	versionDate?: string;

	/** Optional instance identifier for distinguishing multiple sensors of the same type */
	instance?: string;
}

/**
 *
 * A subset of the sensor data required to build the key
 *
 */
export interface SensorKeyData {
	/** key for the system this sensor belongs to */
	systemKey: string;
	/**
	 * Metric configuration - can be either a Metric instance or ParameterUnit object.
	 * If ParameterUnit is provided, it will be converted to a Metric instance during construction.
	 */
	metric: Metric | ParameterUnit;

	/** Optional version date indicating when this sensor configuration was last updated */
	versionDate?: string;

	/** Optional instance identifier for distinguishing multiple sensors of the same type */
	instance?: string;
}

/**
 * JSON serialization format for Sensor objects.
 * Represents the structure returned by the Sensor.json() method.
 *
 */
export interface SensorJSON {
	/** Unique identifier for the sensor */
	key: string;

	/** Version date indicating when this sensor configuration was last updated */
	version_date: string | undefined;

	/** Current operational status of the sensor */
	status?: string;

	/** Instance identifier for distinguishing multiple sensors of the same type */
	instance: string | undefined;

	/** The parameter name being measured by this sensor */
	parameter: string;

	/** The units of measurement for this sensor */
	units: string | undefined;

	/** Time interval in seconds over which sensor values are averaged */
	averaging_interval_secs?: number;

	/** Time interval in seconds at which sensor data is logged */
	logging_interval_secs?: number;

	/** Array of flags associated with this sensor in JSON format */
	flags: FlagJSON[];
}
