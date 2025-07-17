import {
  UnsupportedParameterError,
  UnsupportedUnitsError,
  MissingValueError,
  ProviderValueError,
  HighValueError,
  LowValueError,
} from './errors';



export interface ConverterMapDefinition {
  [key: string]: (v: any) => any;
};


export interface ParameterDefinition {
  numeric: boolean;
  units?: string;
  converters: ConverterMapDefinition;
  range?: [number, number];
  precision?: number
}

export interface ParameterMapDefinition {
  [key: string]: ParameterDefinition;
};

const noConversion = (d: number | string) => +d;
const ppbToPpm = (ppb: number | string) => +ppb/1000;
const mgm3ToUgm3 = (mgm3: number | string) => +mgm3*1000;

// this should be tranform methods that all orgs will use
// regardless of what unit they use to store their data
// somewhere else we will need to define what unit to use for each parameter (not as a constant)
export const PARAMETERS: ParameterMapDefinition = {
  pm25: {
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    }
  },
  pm10: {
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    }
  },
  no2_mass: {
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    }
  },
  nox_mass: {
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    }
  },
  so2_mass: {
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    }
  },
  o3_parts: {
    numeric: true,
    units: 'ppm',
    converters: {
      'ppm': noConversion,
      'ppb': ppbToPpm
    }
  },
  o3_mass: {
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    }
  },
  co_mass: {
    numeric: true,
    units: 'ug/m3',
    converters: {
      'ug/m3': noConversion,
      'mg/m3': mgm3ToUgm3,
    }
  },
  co_parts: {
    numeric: true,
    units: 'ppm',
    converters: {
      'ppm': noConversion,
      'ppb': ppbToPpm,
    }
  },
  no2_parts: {
    numeric: true,
    units: 'ppm',
    converters: {
      'ppm': noConversion,
      'ppb': ppbToPpm,
    }
  },
  so2_parts: {
    numeric: true,
    units: 'ppm',
    converters: {
      'ppm': noConversion,
      'ppb': ppbToPpm,
    }
  },
  'temperature': {
    numeric: true,
    units: 'c',
    precision: 1,
    range: [-50, 50],
    converters: {
      'f': (d: number | string) => (+d-32) * 5/9,
      'c': (d: number| string) => +d
    },
  }
}

export const PROVIDER_VALUE_FLAGS: Array<any> = [-99, -999, '-99', '-999'];

export interface MetricDefinition {
  parameter: string;
  unit: string;
}

export class Metric {
  key: string
  parameter: ParameterDefinition;
  unit: string;
  numeric: Boolean = true;
  precision?: number;
  converter: Function


  constructor(parameter: string, unit: string) {
    this.key = parameter
    this.parameter = PARAMETERS[parameter];
    this.unit = unit;

    if (!this.parameter) {
      throw new UnsupportedParameterError(parameter);
    }
    if (!this.parameter?.converters[this.unit]) {
      throw new UnsupportedUnitsError(parameter, unit);
    }
    this.converter = this.parameter?.converters[this.unit]

    if (this.parameter?.precision) {
      this.precision = Math.round(this.parameter.precision)
    }

    this.numeric = this.parameter?.numeric;
  }


  process(v: any) {

    const range = this.parameter?.range
    let nv = null;

    // first check if its some form of missing
    if (['', null, undefined, NaN].includes(v)) {
      throw new MissingValueError(v)
    }

    // next check if its a string but should be a number
    if (this.numeric && !Number.isFinite(+v)) {
      throw new ProviderValueError(v)
    }

    // check for any error that the provider passed as a value
    if (PROVIDER_VALUE_FLAGS.includes(v)) {
      throw new ProviderValueError(v)
    }

    nv = this.converter(v);

    // adjust the precision if needed
    if (this.precision) {
      const mult = Math.round(this.precision)*10;
      nv = Math.round(nv * mult) / mult
    }

    // check for issues and throw an error
    if (range && range.length === 2) {
      if(nv < range[0]) {
        throw new LowValueError(nv, range[0])
      }
      if(nv > range[1]) {
        throw new HighValueError(nv, range[1])
      }
    }
    return nv
  }


}
