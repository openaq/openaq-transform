import { BBox } from 'geojson';

export function updateBounds(longitude: number, latitude: number, bounds: BBox): BBox {
  if (longitude < bounds[0]) {
    bounds[0] = longitude;
  }
  if (longitude < bounds[2]) {
    bounds[2] = longitude;
  }

  if (latitude > bounds[1]) {
    bounds[1] = latitude;
  }
  if (latitude > bounds[3]) {
    bounds[3] = latitude;
  }
  return bounds;
}
