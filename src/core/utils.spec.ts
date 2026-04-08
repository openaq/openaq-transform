import { describe, expect, test } from 'vitest';
import type { PathExpression } from '../types/metric.ts';
import { SourceRecord } from '../types/data.ts';

import {
  cleanKey,
  countDecimals,
  getBoolean,
  getNumber,
  getString,
  getArray,
  getValueFromKey,
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
  expect(getValueFromKey({}, 'undefined_key')).toBe(undefined);
});

test('getValueFromKey returns value when key exists', () => {
  expect(getValueFromKey({ pm25: null }, 'pm25')).toBe(null);
});

test('getValueFromKey returns value when using key function', () => {
  expect(getValueFromKey({ pm25: 42 }, (o) => o.pm25)).toBe(42);
});

test('getValueFromKey throws for unsafe optional property access', () => {
  expect(getValueFromKey({ pm25: null }, (o) => o.foo)).toThrow(Error);
});

test('getValueFromKey returns value when using jmespath expression', () => {
  const pathExpression = {
    type: 'jmespath',
    expression: '$.measurements[0].pm25',
  } satisfies PathExpression;
  expect(
    getValueFromKey({ measurements: [{ pm25: 42 }] }, pathExpression),
  ).toBe(42);
});

test('getValueFromKey throws when unsupported expression type is passed', () => {
  // @ts-expect-error Testing unsupported type value
  const pathExpression = {
    type: 'xpath',
    expression: '/measurements[0]/pm25',
  } satisfies PathExpression;
  // @ts-expect-error Testing unsupported type value
  expect(() =>
    getValueFromKey({ measurements: [{ pm25: 42 }] }, pathExpression),
  ).toThrow(TypeError);
});

test('countDecimals returns the right value', () => {
  expect(countDecimals(7.24)).toBe(2);
});

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

const record = (value: unknown) => ({ value }) as unknown as SourceRecord;
const key = "value";

describe('getString', () => {
  test('returns the string value as-is', () => {
    expect(getString(record('hello'), key)).toBe('hello');
  });

  test('coerces a number to string', () => {
    expect(getString(record(42), key)).toBe('42');
  });

  test('coerces a boolean to string', () => {
    expect(getString(record(true), key)).toBe('true');
  });

  test('returns undefined for null', () => {
    expect(getString(record(null), key)).toBeUndefined();
  });

  test('returns undefined for undefined', () => {
    expect(getString(record(undefined), key)).toBeUndefined();
  });

  test('returns empty string for empty string', () => {
    expect(getString(record(''), key)).toBe('');
  });
});

describe('getNumber', () => {
  test('returns a number value as-is', () => {
    expect(getNumber(record(42), key)).toBe(42);
  });

  test('coerces a numeric string to number', () => {
    expect(getNumber(record('3.14'), key)).toBe(3.14);
  });

  test('returns undefined for null', () => {
    expect(getNumber(record(null), key)).toBeUndefined();
  });

  test('returns undefined for undefined', () => {
    expect(getNumber(record(undefined), key)).toBeUndefined();
  });

  test('returns undefined for non-numeric string', () => {
    expect(getNumber(record('abc'), key)).toBeUndefined();
  });

  test('returns undefined for empty string', () => {
    expect(getNumber(record(''), key)).toBeUndefined();
  });

  test("returns 0 for '0'", () => {
    expect(getNumber(record('0'), key)).toBe(0);
  });
});

describe('getBoolean', () => {
  test('returns true for boolean true', () => {
    expect(getBoolean(record(true), key)).toBe(true);
  });

  test('returns false for boolean false', () => {
    expect(getBoolean(record(false), key)).toBe(false);
  });

  test('returns false for string "false"', () => {
    expect(getBoolean(record('false'), key)).toBe(false);
  });

  test('returns false for string "FALSE"', () => {
    expect(getBoolean(record('FALSE'), key)).toBe(false);
  });

  test('returns false for string "0"', () => {
    expect(getBoolean(record('0'), key)).toBe(false);
  });

  test('returns true for string "true"', () => {
    expect(getBoolean(record('true'), key)).toBe(true);
  });

  test('returns true for string "TRUE"', () => {
    expect(getBoolean(record('TRUE'), key)).toBe(true);
  });

  test('returns true for string "1"', () => {
    expect(getBoolean(record('1'), key)).toBe(true);
  });

  test('returns false for null', () => {
    expect(getBoolean(record(null), key)).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(getBoolean(record(''), key)).toBe(false);
  });

  test('returns true for a non-empty arbitrary string', () => {
    expect(getBoolean(record('some-value'), key)).toBe(true);
  });
});

describe('getArray tests', () => {
  test('returns array for string array', () => {
    expect(getArray(record(['some-value']), key)).toStrictEqual(['some-value']);
  });
  test('returns array for string', () => {
    expect(getArray(record('some-value'), key)).toStrictEqual(['some-value']);
  });
  test('returns array for numeric array', () => {
    expect(getArray(record([0]), key)).toStrictEqual([0]);
  });
  test('returns array for number', () => {
    expect(getArray(record(0), key)).toStrictEqual([0]);
  });
  test('returns undefined for undefined', () => {
    expect(getArray(record(undefined), key)).toBeUndefined();
  });
  test('returns undefined for null', () => {
    expect(getArray(record(null), key)).toBeUndefined();
  });
  test('returns empty array for array', () => {
    expect(getArray(record([]), key)).toStrictEqual([]);
  });

});
