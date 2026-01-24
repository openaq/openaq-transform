import { expect, test } from 'vitest';
import { Coordinates, updateBounds } from './coordinates';
import proj4 from 'proj4';
import type { BBox } from 'geojson';

test('Coordinates latitude and longitude return unchanged value for EPSG:4326', () => {
  const coordinates = new Coordinates(32, 42);
  expect(coordinates.longitude).toBe(32);
  expect(coordinates.latitude).toBe(42);
});

test('Coordinates latitude and longitude return unchanged value for WGS84', () => {
  const coordinates = new Coordinates(32, 42, 'WGS84');
  expect(coordinates.longitude).toBe(32);
  expect(coordinates.latitude).toBe(42);
});

test('Coordinates latitude and longitude return correct lat/lng value for projection with predefined alias', () => {

  const coordinates = new Coordinates(-6796397.7770, 1644767.5597, 'EPSG:3857');
  expect(coordinates.latitude).toBe(14.614111000419951);
  expect(coordinates.longitude).toBe(-61.05308000035039);
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

test('Coordinates json() method returns correct structure and values for WGS84', () => {
  const coordinates = new Coordinates(75.0, 15.0);
  const jsonOutput = coordinates.json();
  expect(jsonOutput).toEqual({
    latitude: 15.0,
    longitude: 75.0,
    proj: 'EPSG:4326',
  });
});

test('Coordinates json() method returns correct structure and values for projected coordinates', () => {
  const coordinates = new Coordinates(-6796397.7770, 1644767.5597, 'EPSG:3857');
  const jsonOutput = coordinates.json();
  expect(jsonOutput.latitude).toBe(14.614111000419951);
  expect(jsonOutput.longitude).toBe(-61.05308000035039);
  expect(jsonOutput.proj).toBe('EPSG:4326');
});

test('Coordinates fail when latitude is null', () => {
  // @ts-expect-error Testing null input validation
  expect(() => new Coordinates(20, null)).toThrowError(/Latitude/);
});

test('Coordinates fail when longitude is null', () => {
  // @ts-expect-error Testing null input validation
  expect(() => new Coordinates(null, 20)).toThrowError(/Longitude/);
});

test('Coordinates fail when projection is invalid', () => {
  expect(() => new Coordinates(20, 20, 'WSG84')).toThrowError(/PROJ4/);
});

test('Coordinates throws longitude out of bounds', () => {
  expect(() => new Coordinates(200, 20)).toThrowError(/Longitude/);
});

test('Coordinates throws latitude out of bounds', () => {
  expect(() => new Coordinates(20, 200)).toThrowError(/Latitude/);
});

test('Coordinates throws precision default error', () => {
  expect(() => new Coordinates(172.12, 85.12, 'EPSG:4326', 3)).toThrowError(/precise/);
});


test('updateBounds initializes bounds correctly when null', () => {
  const coords = new Coordinates(10, 20);
  const newBounds = updateBounds(coords, null);
  expect(newBounds).toEqual([10, 20, 10, 20]);
});

test('updateBounds initializes bounds correctly when undefined', () => {
  const coords = new Coordinates(-5, -15);
  const newBounds = updateBounds(coords, undefined);
  expect(newBounds).toEqual([-5, -15, -5, -15]);
});

test('updateBounds expands bounds in all directions', () => {
  const initialBounds: BBox = [0, 0, 10, 10];
  const coords = new Coordinates(-5, 15);
  const newBounds = updateBounds(coords, initialBounds);
  expect(newBounds).toEqual([-5, 0, 10, 15]);

  const coords2 = new Coordinates(15, -5);
  const newBounds2 = updateBounds(coords2, newBounds);
  expect(newBounds2).toEqual([-5, -5, 15, 15]);
});

test('updateBounds does not mutate the original bounds array', () => {
  const initialBounds: BBox = [0, 0, 10, 10];
  const originalBoundsCopy = [...initialBounds];
  const coords = new Coordinates(5, 5);
  updateBounds(coords, initialBounds);

  expect(initialBounds).toEqual(originalBoundsCopy);
});

test('updateBounds returns a new array instance', () => {
  const initialBounds: BBox = [0, 0, 10, 10];
  const coords = new Coordinates(5, 5);
  const newBounds = updateBounds(coords, initialBounds);
  expect(newBounds).not.toBe(initialBounds);
});

test('updateBounds does not change bounds if coordinate is within existing bounds', () => {
  const initialBounds: BBox = [0, 0, 10, 10];
  const coords = new Coordinates(5, 5);
  const newBounds = updateBounds(coords, initialBounds);
  expect(newBounds).toEqual(initialBounds);
});

test('updateBounds expands only minX', () => {
  const initialBounds: BBox = [5, 5, 10, 10];
  const coords = new Coordinates(2, 7);
  const newBounds = updateBounds(coords, initialBounds);
  expect(newBounds).toEqual([2, 5, 10, 10]);
});

test('updateBounds expands only maxX', () => {
  const initialBounds: BBox = [0, 0, 5, 5];
  const coords = new Coordinates(7, 2);
  const newBounds = updateBounds(coords, initialBounds);
  expect(newBounds).toEqual([0, 0, 7, 5]);
});

test('updateBounds expands only minY', () => {
  const initialBounds: BBox = [0, 5, 10, 10];
  const coords = new Coordinates(5, 2);
  const newBounds = updateBounds(coords, initialBounds);
  expect(newBounds).toEqual([0, 2, 10, 10]);
});

test('updateBounds expands only maxY', () => {
  const initialBounds: BBox = [0, 0, 10, 5];
  const coords = new Coordinates(5, 7);
  const newBounds = updateBounds(coords, initialBounds);
  expect(newBounds).toEqual([0, 0, 10, 7]);
});

test('updateBounds correctly copies existing bounds when provided', () => {
  const existingBounds: BBox = [10, 20, 30, 40];
  const coord = new Coordinates(15, 25);
  const newBounds = updateBounds(coord, existingBounds);

  expect(newBounds).not.toBe(existingBounds);

  expect(newBounds).toEqual(existingBounds);
  const coords = new Coordinates(5, 45);
  const expandedBounds = updateBounds(coords, existingBounds);
  expect(expandedBounds).not.toBe(existingBounds);
  expect(existingBounds).toEqual([10, 20, 30, 40]);
  expect(expandedBounds).toEqual([5, 20, 30, 45]);
});


test('updateBounds copies existing bounds array when provided (branch coverage for [...bounds])', () => {
  const initialBounds: BBox = [1, 2, 3, 4];
  const coords = new Coordinates(2, 3);
  const newBounds = updateBounds(coords, initialBounds);
  expect(newBounds).not.toBe(initialBounds);
  expect(newBounds).toEqual(initialBounds);
  expect(initialBounds).toEqual([1, 2, 3, 4]);
});
