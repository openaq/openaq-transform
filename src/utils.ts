import {
  InvalidPrecisionError,
  LatitudeBoundsError,
  LongitudeBoundsError,
} from './errors';


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

export const truthy = (value): boolean => {
    return [1,true,'TRUE','T','True','t','true'].includes(value);
};

export const parseData = (data, key) => {
    if(typeof(key) === 'function') {
        return key(data);
    } else if (typeof(key) === 'string') {
        return data[key];
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

export const stripWhitespace = (value) => {
  if (typeof value === 'string') {
    return value.replace(/^[ ]+|[ ]+$/, '');
  } else {
    return value;
  }
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

export function timestampFactory(
  year: number,
  month: number,
  day: number,
  hour: number,
  minutes: number,
  seconds: number = 0,
  offset: string
): string {
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const hourStr = hour.toString().padStart(2,'0');
    const minuteStr = minutes.toString().padStart(2, '0');
    const secondStr = seconds.toString().padStart(2, '0');

    return `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:${secondStr}${offset}`;
}
