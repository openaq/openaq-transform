import {
  InvalidPrecisionError,
  LatitudeBoundsError,
  LongitudeBoundsError,
} from './errors';

import { ParserMethodsDefinition } from './parsers';
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
    return [1,true,'TRUE','T','True','t','true'].includes(value);
};

export const getValueFromKey = (data: any, key: Function | string) => {
    if(typeof key === 'function') {
        return key(data);
    } else if (typeof key === 'string') {
        return data ? data[key] : key;
    }
}

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

function countDecimals(value: number) {
    if(Math.floor(value.valueOf()) === value.valueOf()) return 0;
    return value.toString().split(".")[1].length || 0;
}

export function validateCoordinates(
  latitude: number,
  longitude: number,
  precision: number = 3
): void {
  if (latitude < -90 || latitude > 90) {
    throw new LatitudeBoundsError();
  }
  if (longitude < -180 || longitude > 180) {
    throw new LongitudeBoundsError();
  }
  if (
    countDecimals(latitude) < precision ||
    countDecimals(longitude) < precision
  ) {
    throw new InvalidPrecisionError(precision);
  }
}


// temporary method
export function isFile (obj: object) {
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
    key: string | Function | null,
    method: Function | string,
    methods: ParserMethodsDefinition | ReaderMethodsDefinition
): Function {
    // key would be passed when we have a keyed url
    if(key) {
        if (method && typeof(method) === 'object' && typeof(key) === 'string') {
            // use the key to extract the name of the reader
            key = method![key];
        } else if(method && ['string','function'].includes(typeof(method))) {
            // does not matter that key was passed, use the reader value
            key = method;
        }
    } else {
        key = method;
    }
    // we could allow the reader to be a string or a function
    if (typeof key === 'string') {
        // if its a string we would pull it from our avaiable readers
        // we would do this if we needed different readers for each node of data (e.g. locations, measurements)
        if(!methods[key]) {
            throw new Error(`Could not find a method named '${key}'`)
        }
        return methods[key];
    } else if (typeof key === 'function') {
        // and then if we only needed one CUSTOM reader, we could set it when we extend the client
        return key;
    } else {
        // just a pass through??
        return (a: any) => a;
    }
}
