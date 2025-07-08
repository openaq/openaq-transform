import {
  InvalidPrecisionError,
  LatitudeBoundsError,
  LongitudeBoundsError,
} from './errors';

import {
  ParserObjectDefinition,
  ParserMethodsDefinition,
} from './parsers';
import { ReaderMethodsDefinition } from './readers';

export const stripNulls = <T extends object>(
  obj: T
): { [K in keyof T]: T[K] } => {
  return Object.assign(
    {},
    ...Object.entries(obj)
      .filter(([_, v]) => ![null, NaN, '', undefined, 'undefined'].includes(v))
      .map(([k, v]) => ({ [k]: v }))
  );
};

export const truthy = (value: any): boolean => {
  return [1, true, 'TRUE', 'T', 'True', 't', 'true'].includes(value);
};


export const getValueFromKey = (data: any, key: Function | string, asNumber: boolean = false) => {
  let value = null
  if (typeof key === 'function') {
    value = key(data);
  } else if (typeof key === 'string') {
    value = data ? data[key] : key;
  }
  // the csv method reads everything in as strings
  // null values should remain null and not be converted to 0
  if(value && asNumber && typeof(value) !== 'number') {
    value = Number(value)
  }
  return value;
};

export const cleanKey = (value: string): string => {
  return (
    value &&
      value
        .replace(/^\s+|\s+$/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^\w]/g, '')
        .toLowerCase()
  );
};

export const stripWhitespace = (value: string): string => {
  return value.replace(/^[ ]+|[ ]+$/, '');
};

export function validateCoordinates(
  latitude: number,
  longitude: number,
  precision: number = 3
): void {
  if (latitude < -90 || latitude > 90) {
    throw new LatitudeBoundsError(latitude);
  }
  if (longitude < -180 || longitude > 180) {
    throw new LongitudeBoundsError(longitude);
  }
  if (countDecimals(latitude) < precision) {
    throw new InvalidPrecisionError(latitude, precision);
  }
  if (countDecimals(longitude) < precision) {
    throw new InvalidPrecisionError(longitude, precision);
  }
}
/**
 * Count the number of decimal places in value
 * @returns number
 */
export function countDecimals(value: number) {
  if (Math.floor(value.valueOf()) === value.valueOf()) return 0;
  return value.toString().split('.')[1].length || 0;
}


// temporary method
export function isFile(obj: object) {
  return obj.constructor.name === 'File';
}

/**
 *  Method to determine which method we want to use to parse/read
 * the return value for this is a function
 * key (string): an index to get a method from a set of methods
 * key (function): a function that is ready to be used
 * method (string)
 */
export function getMethod(
  key: 'measurements' | 'locations' | Function | null,
  method: Function | string | ParserObjectDefinition,
  methods: ParserMethodsDefinition | ReaderMethodsDefinition
): Function {
  let methodKeyOrFunction: string | Function;

  if (typeof key === 'function') {
    methodKeyOrFunction = key;
  }
  if (key !== null) {
    if (
      typeof method === 'object' &&
        'measurements' in method &&
        'locations' in method &&
        typeof key === 'string' &&
        ['measurements', 'locations'].includes(key)
    ) {
      methodKeyOrFunction = method[key as keyof ParserObjectDefinition] as string;
    } else if (typeof method === 'string' || typeof method === 'function') {
      methodKeyOrFunction = method;
    } else {
      methodKeyOrFunction = key;
    }
  } else {
    if (typeof method === 'string' || typeof method === 'function') {
      methodKeyOrFunction = method;
    } else {
      throw new TypeError(
        "Invalid 'method' type provided when 'key' is null. Expected string, function, or ClientParserObjectDefinition."
      );
    }
  }

  if (typeof methodKeyOrFunction === 'string') {
    if (!methods) {
      throw new Error(
        `No methods available`
      );
    }
    if (!methods[methodKeyOrFunction]) {
      throw new Error(
        `Could not find a method named '${methodKeyOrFunction}' in available methods: ${Object.keys(methods)}. `
      );
    }
    return methods[methodKeyOrFunction];
  } else {
    return methodKeyOrFunction;
  }

}
