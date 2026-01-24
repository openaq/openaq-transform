import type { CoordinatesJSON } from "./coordinates";
import type { SystemJSON } from "./system";

/**
 * Input data structure for instantiating the Location class.
 *
 * @example
 * ```ts
 * // Fixed monitoring station
 * const locationData: LocationData = {
 *   key: "loc-station-001",
 *   siteId: "site-downtown",
 *   siteName: "Downtown Air Quality Station",
 *   owner: "Environmental Protection Agency",
 *   label: "Main Street",
 *   x: -100.7878,
 *   y: 46.8042,
 *   projection: "EPSG:4326",
 *   ismobile: false,
 *   status: "active",
 *   averagingIntervalSeconds: 3600,
 *   loggingIntervalSeconds: 46.8042
 * };
 *
 * // Mobile monitoring unit
 * const mobileLocation: LocationData = {
 *   key: "loc-mobile-truck-02",
 *   siteId: "site-mobile-fleet",
 *   siteName: "Mobile Monitoring Fleet",
 *   owner: "City Environmental Department",
 *   label: "Mobile Unit #2",
 *   x: -71.0565,
 *   y: 42.3555,
 *   ismobile: true,
 *   status: "deployed"
 * };
 * ```
 */
export interface LocationData {
	/** Optional provider value for building key */
	provider: string;

	/** Identifier for the site this location belongs to */
	siteId: string;

	/** Human-readable name of the site */
	siteName: string;

	/** Organization or entity that owns this location */
	owner: string;

	/** Optional descriptive label for this specific location */
	label: string;

	/** X coordinate (longitude for geographic projections) */
	x: number;

	/** Y coordinate (latitude for geographic projections) */
	y: number;

	/**
	 * Optional coordinate reference system identifier (e.g., "EPSG:4326" for WGS84).
	 * valid values are defined by proj4 {@link https://github.com/proj4js/proj4js}.
	 */
	projection?: string;

	/** Whether this location represents a mobile monitoring unit */
	ismobile: boolean;

	/** Current operational status of the location (e.g., "active", "inactive", "deployed") */
	status: string;

	/**
	 * Optional default time interval in seconds over which sensor values are averaged
	 * at this location. Can be overridden by individual sensors.
	 */
	averagingIntervalSeconds?: number;

	/**
	 * Optional default time interval in seconds at which sensor data is logged
	 * at this location. Defaults to averagingIntervalSeconds if not provided.
	 */
	loggingIntervalSeconds?: number;
}

/**
 *
 *
 */
export interface LocationKeyData {
	/** Required provider value for building key */
	provider: string;

	siteId: string;
}

/**
 * JSON serialization format for Location objects.
 * Represents the structure returned by the Location.json() method.
 *
 */
export interface LocationJSON {
	/** key for the location */
	key: string;

	/** Identifier for the site this location belongs to */
	site_id: string;

	/** Human-readable name of the site */
	site_name: string;

	/** Processed coordinate information including projection details */
	coordinates: CoordinatesJSON;

	/** Whether this location represents a mobile monitoring unit */
	ismobile: boolean;

	/** Array of systems associated with this location in JSON format */
	systems: SystemJSON[];
}
