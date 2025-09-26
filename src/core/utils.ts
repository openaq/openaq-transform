import debug from 'debug';
import type { ParserMethods, IndexedParser } from '../types/parsers';
import type { ReaderMethods } from '../types/readers';
const log = debug('utils: v2')

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


export function formatValueForLog(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'function') {
    return value.name || '[Function]';
  }
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object Object]';
    }
  }
  return `[${typeof value}]`;
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
  method: Function | string | IndexedParser,
  methods: ParserMethods | ReaderMethods
): Function {
  let methodKeyOrFunction: string | Function;
  log(`Getting method for '${String(key)}' from ${formatValueForLog(method)} and ${Object.keys(methods).join(', ')}`)

  if (typeof key === 'function') {
    methodKeyOrFunction = key;
  }

  if (key !== null) {
    if (
      typeof method === 'object' &&
        ('measurements' in method || 'locations' in method || 'meta' in method)
        && typeof key === 'string' &&
        ['measurements', 'locations', 'meta'].includes(key)
    ) {
      methodKeyOrFunction = method[key as keyof IndexedParser] as string;
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
        `Could not find a method named '${methodKeyOrFunction}' in the available methods: ${Object.keys(methods).join(', ')}. `
      );
    }
    return methods[methodKeyOrFunction];
  } else {
    return methodKeyOrFunction;
  }

}
