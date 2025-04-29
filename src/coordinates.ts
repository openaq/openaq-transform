import proj4 from 'proj4';
import { BBox } from 'geojson';

/* Class representing geographic coordinates */
export class Coordinates {
  x: number;
  y: number;
  proj: string; // a proj4 string


  /**
   * Creates new coordinates instance
   *
   * @param x
   * @param y
   * @param proj
   */
  constructor(x: number, y: number, proj: string = 'EPSG:4326') {
    this.x = x;
    this.y = y;
    this.proj = proj;
    this._projected = [this.x, this.y];


    if (!['EPSG:4326','WGS84'].includes(this.proj)) {
      this._projected = proj4(this.proj, 'EPSG:4326', [this.x, this.y]);
    }

  }

  get latitude() : number {
    return this._projected[1]
  }

  get longitude(): number {
    return this._projected[0]
  }

  json() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      proj: 'EPSG:4326',
    }
  }

}

export function updateBounds(coordinates: Coordinates,  bounds: BBox | null): BBox {
  if(!coordinates) return bounds;
  const { x, y } = coordinates
  console.debug('updating boundary', x, y)
  if(!bounds) return [x, y, x, y]
  if (x < bounds[0]) {
    bounds[0] = x;
  }
  if (x > bounds[2]) {
    bounds[2] = x;
  }

  if (y > bounds[1]) {
    bounds[1] = y;
  }
  if (y < bounds[3]) {
    bounds[3] = y;
  }
  return bounds;
}
