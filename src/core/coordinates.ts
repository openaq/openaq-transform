import proj4 from 'proj4';
import { BBox } from 'geojson';

/**
 * Interface representing a JSON definition for geographic coordinates,
 * specifically in 'EPSG:4326' (WGS84) projection.
 */
export interface CoordinatesJsonDefinition {
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

/**
 * Represents geographic coordinates, capable of handling different projections
 * and providing access to latitude and longitude in 'EPSG:4326'.
 */
export class Coordinates {
  /**
   * The x-coordinate in the specified projection.
   */
  x: number;
  /**
   * The y-coordinate in the specified projection.
   */
  y: number;
  /**
   * The proj4 string representing the coordinate system (e.g., 'EPSG:4326', 'EPSG:3857').
   */
  proj: string; 
  /**
   * @private
   * Stores the projected coordinates in 'EPSG:4326' format: [longitude, latitude].
   */
  #projected: [number, number];

  /**
   * Creates a new Coordinates instance.
   * If the input `proj` is not 'EPSG:4326' or 'WGS84', the coordinates will be
   * projected to 'EPSG:4326' internally for `latitude` and `longitude` access.
   *
   * @param x The x-coordinate in the specified projection.
   * @param y The y-coordinate in the specified projection.
   * @param proj The proj4 string for the input coordinates' projection. Defaults to 'EPSG:4326' (WGS84).
   * @example
   * // WGS84 coordinates
   * const coords = new Coordinates(106.82293,-6.22383,'EPSG:4326');
   * console.log(coords.latitude, coords.longitude); // -6.22383, 106.82293
   */
  constructor(x: number, y: number, proj: string = 'EPSG:4326') {
    this.x = x;
    this.y = y;
    this.proj = proj;
    this.#projected = [this.x, this.y];

    // If the projection is not already WGS84, project it.
    if (!['EPSG:4326','WGS84'].includes(this.proj)) {
      this.#projected = proj4(this.proj, 'EPSG:4326', [this.x, this.y]);
    }

  }

  /**
   * Gets the latitude of the coordinate in degrees, always in 'EPSG:4326' (WGS84).
   * @returns The latitude in degrees.
   * @example
   * const coords = new Coordinates(106.82293,-6.22383);
   * console.log(coords.latitude); // -6.22383
   */
  get latitude() : number {
    return this.#projected[1]
  }


  /**
   * Gets the longitude of the coordinate in degrees, always in 'EPSG:4326' (WGS84).
   * @returns The longitude in degrees.
   * @example
   * const coords = new Coordinates(106.82293,-6.22383);
   * console.log(coords.latitude); // 106.82293
   */
  get longitude(): number {
    return this.#projected[0]
  }

  /**
   * Returns a JSON representation of the coordinates,
   * always projected to 'EPSG:4326' (WGS84).
   * @returns An object conforming to `CoordinatesJsonDefinition`.
   * @example
   * const coords = new Coordinates(106.82293,-6.22383);
   * console.log(coords.json());
   * // { latitude: -6.22383, longitude: 106.82293, proj: 'EPSG:4326' }
   */
  json(): CoordinatesJsonDefinition {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      proj: 'EPSG:4326',
    }
  }

}


/**
 * Calculates a new bounding box array (BBox) that includes the given coordinates,
 * and a provided `bounds` array without mutating the original `bounds` array.
 * This function returns a *new* BBox array.
 * If `bounds` is null or undefined, a new BBox `[x, y, x, y]` is returned.
 * The BBox format is `[minX, minY, maxX, maxY]`.
 * If the `bounds` parameter is null or undefined, a new BBox array is created
 * using the provided coordinates as both minimum and maximum.
 * The BBox format is `[minX, minY, maxX, maxY]`.
 *
 * @param coordinates The `Coordinates` object whose `x` and `y` values
 * (which are assumed to be in the same projection as the `bounds` parameter)
 * will be used to update the bounds.
 * @param bounds The current GeoJSON BBox array to update, or `null`/`undefined` to create a new one.
 * @returns The updated or newly created GeoJSON BBox array.
 * @example
 * let bounds: BBox | null = null;
 * const coords = new Coordinates(10, 20); 
 * bounds = updateBounds(coords, bounds);
 * console.log(bounds); // [10, 20, 10, 20]
 *
 * const coords2 = new Coordinates(5, 25);
 * bounds = updateBounds(coords2, bounds);
 * console.log(bounds); // [5, 25, 10, 20]
 *
 * const coords3 = new Coordinates(15, 15);
 * bounds = updateBounds(coords3, bounds);
 * console.log(bounds); // [5, 15, 15, 25]
 */
export function updateBounds(coordinates: Coordinates,  bounds: BBox | null | undefined): BBox {
  const { x, y } = coordinates
  console.debug('updating boundary', x, y)
  let newBounds: BBox;
  if (!bounds) {
    newBounds = [x, y, x, y];
  } else {
    newBounds = [...bounds];
  }
  if (x < newBounds[0]) {
    newBounds[0] = x;
  }
  if (x > newBounds[2]) {
    newBounds[2] = x;
  }
  if (y < newBounds[1]) {
    newBounds[1] = y;
  }
  if (y > newBounds[3]) {
    newBounds[3] = y;
  }
  return newBounds;
}
