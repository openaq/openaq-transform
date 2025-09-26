/**
 * Interface representing a JSON definition for geographic coordinates,
 * specifically in 'EPSG:4326' (WGS84) projection.
 */
export interface CoordinatesJSON {
    /**
   * The latitude coordinate in degrees.
   * @example 36.035513
   */
  latitude: number,
  /**
   * The longitude coordinate in degrees.
   * @example 36.091573
   */
  longitude: number,
  /**
   * The projection string.
   * @example 'EPSG:4326'
   */
  proj: string
}