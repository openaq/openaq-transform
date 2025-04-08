import proj4 from 'proj4';

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
  }

  /**
   * Projects the provided x and y values to the given projection.
   *
   * @returns The projected x,y values
   */
  private _project() : number[] {
    if (['EPSG:4326','WGS84'].includes(this.proj)) {
        return [this.x, this.y];
      } else {
        return proj4(this.proj, 'EPSG:4326', [this.x, this.y]);
      }
  }

  get latitude() : number {
    return this._project()[1]
  }

  get longitude(): number {
    return this._project()[0]

  }
}
