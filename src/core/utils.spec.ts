import { expect, test } from 'vitest';
import {
  cleanKey,
  getValueFromKey,
  getMethod,
  countDecimals,
} from './utils.ts';

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

test('countDecimals returns the right value', () => {
  expect(countDecimals(7.24)).toBe(2)
})


test('getMethod returns method by key', () => {
  const jsonParserFunction = ({text}) => text
  const csvParserFunction = ({text}) => text
  const f = getMethod(
    'locations', { locations: 'json', measurements: 'csv' },
    {'json': jsonParserFunction, 'csv': csvParserFunction}
  )
  expect(f).toBe(jsonParserFunction)
});

test('getMethod returns method by key', () => {
  const jsonParserFunction = ({text}) => text
  const csvParserFunction = ({text}) => text
  const f = getMethod(
    'measurements',
    { locations: 'json', measurements: 'csv' },
    {'json': jsonParserFunction, 'csv': csvParserFunction}
  )
  expect(f).toBe(csvParserFunction)
});

test('getMethod returns function when key is function', () => {
  const jsonParserFunction = ({text}) => text
  const csvParserFunction = ({text}) => text
  const f = getMethod(
    jsonParserFunction, { locations: 'json', measurements: 'csv' },
    {'json': jsonParserFunction, 'csv': csvParserFunction}
  )
  expect(f).toBe(jsonParserFunction)
});

test('getMethod returns method when function is passed', () => {
  const jsonParserFunction = ({text}) => text
  const csvParserFunction = ({text}) => text
  const f = getMethod(
    null, csvParserFunction,
    {'json': jsonParserFunction, 'csv': csvParserFunction}
  )
  expect(f).toBe(csvParserFunction)
});

test('getMethod returns method when function is passed', () => {
  const jsonParserFunction = ({text}) => text
  const csvParserFunction = ({text}) => text
  const f = getMethod(
    null, csvParserFunction,
    {'json': jsonParserFunction, 'csv': csvParserFunction}
  )
  expect(f).toBe(csvParserFunction)
});
