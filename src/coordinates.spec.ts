import { expect, test } from 'vitest';
import { Coordinates } from './coordinates';
import proj4 from 'proj4';

test('Coordinates latitude and longitude return unchanged value for WGS84', () => {
  const coordinates = new Coordinates(32, 42);
  expect(coordinates.longitude).toBe(32);
  expect(coordinates.latitude).toBe(42);
});

test('Coordinates latitude and longitude return correct lat/lng value for custom projection', () => {
  proj4.defs(
    'EPSG:26913',
    '+proj=utm +zone=13 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  );
  const coordinates = new Coordinates(349546.85, 3883647.83, 'EPSG:26913');
  expect(coordinates.latitude).toBe(35.08439434007085);
  expect(coordinates.longitude).toBe(-106.65039003708863);
});
