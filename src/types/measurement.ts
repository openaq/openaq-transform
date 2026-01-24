import type { Coordinates } from "../core/coordinates";
import type { Datetime } from "../core/datetime";
import type { Sensor } from "../core/sensor";
import type { CoordinatesJSON } from "./coordinates";

/**
 * Input data structure for instantiating the Measurement class.
 *
 * @example
 * ```typescript
 * const measurementData: MeasurementData = {
 *   sensor: new Sensor({ key: 'temp-001', metric: temperatureMetric }),
 *   timestamp: new Datetime('2024-01-15T10:30:00Z'),
 *   value: 23.5,
 *   coordinates: new Coordinates(74.1240, 15.2993),
 *   flags: ['calibrated']
 * };
 * ```
 *
 */
export interface MeasurementData {
	/**
	 * The sensor that recorded this measurement.
	 */
	sensor: Sensor;

	/**
	 * The timestamp when this measurement was recorded.
	 */
	timestamp: Datetime;

	/**
	 * The measured value from the sensor.
	 */
	value: number | null;

	/**
	 * Optional geographic coordinates where the measurement was taken.
	 * Used for mobile sensor measurements.
	 */
	coordinates?: Coordinates;

	/**
	 * Optional array of flags indicating measurement quality or processing notes.
	 *
	 * @example ['calibrated', 'validated'] or ['outlier', 'suspect']
	 */
	flags?: ReadonlyArray<string>;
}

/**
 * JSON serialization format for Measurement objects.
 * Represents the structure returned by the Measurement.json() method.
 *
 */
export interface MeasurementJSON {
	/**
	 * Unique identifier combining sensor key and timestamp.
	 * Format: `{sensor.key}-{timestamp.toString()}`
	 */
	key: string;

	/**
	 * ISO 8601 formatted timestamp string.
	 * Represents when the measurement was recorded.
	 */
	timestamp: string | undefined;

	/**
	 * The measured value from the sensor.
	 */
	value: number | null;

	/**
	 * Optional serialized coordinate data.
	 * Geographic location information in JSON-friendly format.
	 */
	coordinates?: CoordinatesJSON;

	/**
	 * Optional array of flags indicating measurement quality or processing notes.
	 *
	 * @example ['error', 'validated']
	 */
	flags?: ReadonlyArray<string>;
}
