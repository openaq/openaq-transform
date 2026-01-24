import type {
  ClientParameters,
  Parameter,
  ParameterMap,
} from '../types/metric';
import {
  UnsupportedParameterError,
  UnsupportedUnitsError,
  MissingValueError,
  ProviderValueError,
  HighValueError,
  LowValueError,
} from './errors';

const noConversion = (d: number | string) => +d;
const ppbToPpm = (ppb: number | string) => +ppb / 1000;
const mgm3ToUgm3 = (mgm3: number | string) => +mgm3 * 1000;

// this should be tranform methods that all orgs will use
// regardless of what unit they use to store their data
// somewhere else we will need to define what unit to use for each parameter (not as a constant)
export const PARAMETERS: ParameterMap = {
  'pm1:mass': {
    name: 'pm1',
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    },
  },
  'pm25:mass': {
    name: 'pm25',
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    },
  },
  'pm4:mass': {
    name: 'pm4',
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    },
  },
  'pm10:mass': {
    name: 'pm10',
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    },
  },
  'no2:mass': {
    name: 'no2',
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    },
  },
  'nox:mass': {
    name: 'nox',
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    },
  },
  'so2:mass': {
    name: 'so2',
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    },
  },
  'o3:parts': {
    name: 'o3',
    numeric: true,
    units: 'ppm',
    converters: {
      ppm: noConversion,
      ppb: ppbToPpm,
    },
  },
  'o3:mass': {
    name: 'o3',
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    },
  },
  'co:mass': {
    name: 'co',
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    },
  },
  'co:parts': {
    name: 'co',
    numeric: true,
    units: 'ppm',
    converters: {
      ppm: noConversion,
      ppb: ppbToPpm,
    },
  },
  'no2:parts': {
    name: 'no2',
    numeric: true,
    units: 'ppm',
    converters: {
      ppm: noConversion,
      ppb: ppbToPpm,
    },
  },
  'so2:parts': {
    name: 'so2',
    numeric: true,
    units: 'ppm',
    converters: {
      ppm: noConversion,
      ppb: ppbToPpm,
    },
  },
  temperature: {
    name: 'temperature',
    numeric: true,
    units: 'c',
    precision: 1,
    range: [-50, 50],
    converters: {
      c: noConversion,
      f: (d: number | string) => ((+d - 32) * 5) / 9,
    },
  },
  rh: {
    name: 'rh',
    numeric: true,
    units: '%',
    precision: 1,
    range: [0, 100],
    converters: {
      '%': noConversion,
    },
  },
  pressure: {
    name: 'pressure',
    numeric: true,
    units: 'hpa',
    precision: 1,
    range: [800, 1100],
    converters: {
      'hpa': noConversion,
      'mb': noConversion,
      'mbar': noConversion,
    },
  },
};

export const PROVIDER_VALUE_FLAGS: Array<any> = [-99, -999, '-99', '-999'];

export const PARAMETER_DEFAULTS: ClientParameters = [
   { parameter: 'pm25', unit: 'ugm3', key: 'pm_25' },
   { parameter: 'o_3', unit: 'ppm', key: 'o3' },
];

export class Metric {
  key: string;
  parameter: Parameter;
  unit: string;
  numeric: boolean = true;
  precision?: number;
  converter: Function;

  constructor(parameter: string, unit: string) {
    let idx = -1;
    // check for parameter(s)
    idx = Object.values(PARAMETERS).findIndex((p) => p.name === parameter);

    if (idx < 0) {
      throw new UnsupportedParameterError(parameter);
    }

    // now add the units
    idx = Object.values(PARAMETERS).findIndex(
      (p) => p.name === parameter && Object.keys(p.converters).includes(unit)
    );

    if (idx < 0) {
      throw new UnsupportedUnitsError(parameter, unit);
    }

    this.key = Object.keys(PARAMETERS)[idx];
    this.parameter = PARAMETERS[this.key];
    this.unit = unit;

    this.converter = this.parameter?.converters[this.unit];

    if (this.parameter?.precision) {
      this.precision = Math.round(this.parameter.precision);
    }

    this.numeric = this.parameter?.numeric;
  }

  process(v: any) {
    const range = this.parameter?.range;
    let nv = null;

    // first check if its some form of missing
    if (['', null, undefined, NaN].includes(v)) {
      throw new MissingValueError(v);
    }

    // next check if its a string but should be a number
    if (this.numeric && !Number.isFinite(+v)) {
      throw new ProviderValueError(v);
    }

    // check for any error that the provider passed as a value
    if (PROVIDER_VALUE_FLAGS.includes(v)) {
      throw new ProviderValueError(v);
    }

    nv = this.converter(v);

    // adjust the precision if needed
    if (this.precision) {
      const mult = Math.round(this.precision) * 10;
      nv = Math.round(nv * mult) / mult;
    }

    // check for issues and throw an error
    if (range && range.length === 2) {
      if (nv < range[0]) {
        throw new LowValueError(nv, range[0]);
      }
      if (nv > range[1]) {
        throw new HighValueError(nv, range[1]);
      }
    }
    return nv;
  }
}
