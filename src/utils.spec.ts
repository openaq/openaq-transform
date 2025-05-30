import { expect, test } from 'vitest';
import { cleanKey, validateCoordinates, getValueFromKey } from './utils.ts';

test('cleanKey replaces only if value is truthy', () => {
  expect(cleanKey('')).toBe('');
});

test('cleanKey removes leading and trailing whitespace', () => {
  expect(cleanKey(' foobar ')).toBe('foobar');
});

test('cleanKey replaces internal spaces with underscore', () => {
  expect(cleanKey('foo bar')).toBe('foo_bar');
});

test('cleanKey removes non-word characters', () => {
  expect(cleanKey('$foo#bar^')).toBe('foobar');
});

test('cleanKey changes string to lowercase', () => {
  expect(cleanKey('FOOBAR')).toBe('foobar');
});

test('getValueFromKey returns undefined when key does not exist', () => {
  expect(getValueFromKey({}, 'undefined_key')).toBe(undefined)
});

test('getValueFromKey returns value when key exists', () => {
  expect(getValueFromKey({ pm25: null }, 'pm25')).toBe(null)
});


test('validateCoordinates catches out of bounds latitude ', () => {
  expect(() => validateCoordinates(95.123,172.123)).toThrowError('Latitude must be between -90 and 90 degrees.');
  expect(() => validateCoordinates(-95.123,172.123)).toThrowError('Latitude must be between -90 and 90 degrees.');
});

test('validateCoordinates catches out of bounds longitude ', () => {
  expect(() => validateCoordinates(85.123,182.123)).toThrowError('Longitude must be between -180 and 180 degrees.');
  expect(() => validateCoordinates(-85.123,-182.123)).toThrowError('Longitude must be between -180 and 180 degrees.');
});

test('validateCoordinates catches coordinate precision default ', () => {
  expect(() => validateCoordinates(85.12,172.12)).toThrowError('Latitude and longitude must be precise to 3 decimal places.');
});

test('validateCoordinates catches coordinate precision custom value ', () => {
  expect(() => validateCoordinates(85.123,172.123, 4)).toThrowError('Latitude and longitude must be precise to 4 decimal places.');
});
