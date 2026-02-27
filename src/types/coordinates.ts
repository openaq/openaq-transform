/**
 * JSON serialization format for Coordinates objects.
 * Represents the structure returned by the Coordinates.json() method.
 *
 */
export interface CoordinatesJSON {
	/**
	 * The latitude coordinate in degrees.
	 * @example 36.035513
	 */
	latitude: number;
	/**
	 * The longitude coordinate in degrees.
	 * @example 36.091573
	 */
	longitude: number;
	/**
	 * The projection string.
	 * @example 'EPSG:4326'
	 */
	proj: string;
}
