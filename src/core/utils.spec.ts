import { describe, expect, test } from 'vitest';
import type { PathExpression } from '../types/metric.ts';
import { SourceRecord } from '../types/data.ts';

import {
  cleanKey,
  cleanNumber,
  countDecimals,
  getBoolean,
  getNumber,
  getString,
  getValueFromKey,
} from './utils.ts';
import { DecimalDigitGroup } from '../types/client.ts';

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


// Test cases based on "common" cases as described in the table here:
// https://en.wikipedia.org/wiki/Decimal_separator#Other_numeral_systems

describe("cleanNumber", () => {

	describe("comma grouped, point decimal", () => {
		const format: DecimalDigitGroup = { decimal: "point", digitGroup: "comma" };
 
		test("parses a fully-formatted number", () => {
			expect(cleanNumber("1,234,567.89", format)).toBe("1234567.89");
		});
 
		test("parses an integer with group separators", () => {
			expect(cleanNumber("1,234,567", format)).toBe("1234567");
		});
 
		test("parses a number without group separator", () => {
			expect(cleanNumber("1234567.89", format)).toBe("1234567.89");
		});
 
		test("parses zero", () => {
			expect(cleanNumber("0.00", format)).toBe("0.00");
		});
 
		test("parses a negative number", () => {
			expect(cleanNumber("-1,234.56", format)).toBe("-1234.56");
		});
 
		test("returns empty string for empty input", () => {
			expect(cleanNumber("  ", format)).toBe("");
		});
	});
 

	describe("no group, point decimal", () => {
		const format: DecimalDigitGroup = { decimal: "point" };
 
		test("parses a plain integer", () => {
			expect(cleanNumber("1234567", format)).toBe("1234567");
		});
 
		test("parses a number with decimal part", () => {
			expect(cleanNumber("1234567.89", format)).toBe("1234567.89");
		});
 
		test("returns empty string for empty input", () => {
			expect(cleanNumber("", format)).toBe("");
		});
	});
 

	describe("no group, comma decimal", () => {
		const format: DecimalDigitGroup = { decimal: "comma" };
 
		test("parses a plain number and converts comma to period", () => {
			expect(cleanNumber("1234567,89", format)).toBe("1234567.89");
		});
 
		test("parses an integer", () => {
			expect(cleanNumber("1234567", format)).toBe("1234567");
		});
	});

	describe("dot grouped, comma decimal", () => {
		const format: DecimalDigitGroup = { decimal: "comma", digitGroup: "dot" };
 
		test("parses a comma decimal got grouped number", () => {
			expect(cleanNumber("1.234.567,89", format)).toBe("1234567.89");
		});
 
		test("parses an integer with dot separators", () => {
			expect(cleanNumber("1.234.567", format)).toBe("1234567");
		});
 
		test("parses a small number", () => {
			expect(cleanNumber("1.000,00", format)).toBe("1000.00");
		});

	});
 
	describe("comma grouped, interpunct decimal", () => {
		const format: DecimalDigitGroup = { decimal: "interpunct", digitGroup: "comma" };
 
		test("parses a interpunct comma grouped number", () => {
			expect(cleanNumber("1,234,567\u00B789", format)).toBe("1234567.89");
		});
 
		test("parses without group separator", () => {
			expect(cleanNumber("1234567\u00B789", format)).toBe("1234567.89");
		});
	});
 
	describe("Indian number grouping", () => {
		const format: DecimalDigitGroup = { decimal: "point", digitGroup: "comma" };
 
		test("parses Indian-style grouping", () => {
			expect(cleanNumber("12,34,567.89", format)).toBe("1234567.89");
		});
	});
 
	describe("apostrophe grouped, point decimal", () => {
		const format: DecimalDigitGroup = { decimal: "point", digitGroup: "apostrophe" };
 
		test("parses an apostrophe grouped point decimal number", () => {
			expect(cleanNumber("1'234'567.89", format)).toBe("1234567.89");
		});
 
		test("parses an integer with apostrophe groups", () => {
			expect(cleanNumber("1'234'567", format)).toBe("1234567");
		});
	});
 
	describe("apostrophe grouped, comma decimal", () => {
		const format: DecimalDigitGroup = { decimal: "comma", digitGroup: "apostrophe" };
 
		test("parses an apostophe grouped comma decimal number", () => {
			expect(cleanNumber("1'234'567,89", format)).toBe("1234567.89");
		});

    test("parses an integer with apostrophe groups", () => {
			expect(cleanNumber("1'234'567", format)).toBe("1234567");
		});
	});
 
	describe("space grouped, comma decimal", () => {
		const format: DecimalDigitGroup = { decimal: "comma", digitGroup: "space" };
 
		test("parses space as group separator", () => {
			expect(cleanNumber("1 234 567,89", format)).toBe("1234567.89");
		});
 
		test("parses non-breaking space (U+00A0) as group separator", () => {
			expect(cleanNumber("1\u00A0234\u00A0567,89", format)).toBe("1234567.89");
		});
 
		test("parses narrow no-break space (U+202F) as group separator", () => {
			expect(cleanNumber("1\u202F234\u202F567,89", format)).toBe("1234567.89");
		});
 
		test("parses an integer with space separators", () => {
			expect(cleanNumber("1 234 567", format)).toBe("1234567");
		});
	});
 
	describe("arabic decimal separator (U+066B)", () => {
		const format: DecimalDigitGroup = { decimal: "arabic" };
 
		test("parses a number with arabic decimal comma", () => {
			expect(cleanNumber("1234567\u066B89", format)).toBe("1234567.89");
		});
	});
});