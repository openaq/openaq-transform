import { expect, test } from 'vitest';
import {
  cleanKey,
  getValueFromKey,
  getMethod,
  countDecimals,
} from './utils.ts';
import { PathExpression } from '../types/metric.ts';

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

test('getValueFromKey returns value when using key function', () => {
  expect(getValueFromKey({ pm25: 42 }, (o) => o.pm25)).toBe(42)
});

test('getValueFromKey throws for unsafe optional property access', () => {
  expect(getValueFromKey({ pm25: null }, (o) => o.foo )).toThrow(Error)
});

test('getValueFromKey returns value when using jmespath expression', () => {
  const pathExpression = { type: 'jmespath', expression: '$.measurements[0].pm25'} satisfies PathExpression;
  expect(getValueFromKey({ measurements :  [{pm25: 42 }]}, pathExpression)).toBe(42)
});

test('getValueFromKey throws when unsupported expression type is passed', () => {
  // @ts-expect-error Testing unsupported type value
  const pathExpression = { type: 'xpath', expression: '/measurements[0]/pm25'} satisfies PathExpression;
  // @ts-expect-error Testing unsupported type value
  expect(() => getValueFromKey({ measurements :  [{pm25: 42 }]}, pathExpression)).toThrow(TypeError)
});

test('countDecimals returns the right value', () => {
  expect(countDecimals(7.24)).toBe(2)
})


// test('getMethod returns method by key', () => {
//   const jsonParserFunction = ({text}) => text
//   const csvParserFunction = ({text}) => text
//   const f = getMethod(
//     'locations', { locations: jsonParserFunction, measurements: csvParserFunction}  )
//   expect(f).toBe(jsonParserFunction)
// });

// test('getMethod returns method by key', () => {
//   const jsonParserFunction = ({text}) => text
//   const csvParserFunction = ({text}) => text
//   const f = getMethod(
//     'measurements',
//     { locations: jsonParserFunction, measurements: csvParserFunction },
//   )
//   expect(f).toBe(csvParserFunction)
// });

// test('getMethod returns function when key is function', () => {
//   const jsonParserFunction = ({text}) => text
//   const csvParserFunction = ({text}) => text
//   const f = getMethod(
//     jsonParserFunction, { locations: 'json', measurements: 'csv' },
//     {'json': jsonParserFunction, 'csv': csvParserFunction}
//   )
//   expect(f).toBe(jsonParserFunction)
// });

// test('getMethod returns method when function is passed', () => {
//   const jsonParserFunction = ({text}) => text
//   const csvParserFunction = ({text}) => text
//   const f = getMethod(
//     null, csvParserFunction,
//     {'json': jsonParserFunction, 'csv': csvParserFunction}
//   )
//   expect(f).toBe(csvParserFunction)
// });

// test('getMethod returns method when function is passed', () => {
//   const jsonParserFunction = ({text}) => text
//   const csvParserFunction = ({text}) => text
//   const f = getMethod(
//     null, csvParserFunction,
//     {'json': jsonParserFunction, 'csv': csvParserFunction}
//   )
//   expect(f).toBe(csvParserFunction)
// });
