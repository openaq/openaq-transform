import { PARAMETERS } from './metric'

const TRANSFORM_ERROR = Symbol('Transform error');
const MEASUREMENT_ERROR = Symbol('Measurement error');
const LOCATION_ERROR = Symbol('Location error');


export class TransformError extends RangeError {
  name: string
  type: symbol
  value?: any
  flag?: string

  constructor(message: string, value: any) {
    super(`${message}. Client provided '${value}'.`);
    this.name = this.constructor.name;
    this.type = TRANSFORM_ERROR
    this.value = value
  }

}

export class LocationError extends TransformError {
  constructor(message: string, value: any) {
    super(message, value);
    this.type = LOCATION_ERROR;
  }
}

export class LatitudeBoundsError extends LocationError {
  constructor(value: number) {
    super(`Latitude must be between -90 and 90 degrees.`, value);
  }
}

export class LongitudeBoundsError extends LocationError {
  constructor(value: number) {
    super('Longitude must be between -180 and 180 degrees.', value);
  }
}

export class InvalidPrecisionError extends LocationError {
  constructor(value: number, precision: number) {
    super(
      `Latitude and longitude must be precise to ${precision} decimal places.`, value
    );
  }
}


class MeasurementError extends TransformError {
  constructor(message: string, value: any) {
    super(message, value)
    this.type = MEASUREMENT_ERROR;
  }
}

export class MissingAttributeError extends MeasurementError {
  constructor(attribute: string, value: any) {
    super(`Missing '${attribute}' attribute.`, value)
  }
}

// provide the parameter
// return the parameters that we do support
export class UnsupportedParameterError extends MeasurementError {
  constructor(parameter: string) {
    const supportedParameters = Object.keys(PARAMETERS)?.join(', ');
    super(`Parameter currently unsupported. Currently supporting ${supportedParameters}`, parameter)
  }
}

// provide the units and the parameter
// return what units we support in that parameter
export class UnsupportedUnitsError extends MeasurementError {
  constructor(parameter: string, units: string) {
    const supportedUnits = Object.values(PARAMETERS)
      .filter(d => d.name == parameter)
      .map(d => Object.keys(d.converters))
      .flat()
      .join(',')
    super(`Unsupported units for '${parameter}'. Currently supporting ${supportedUnits}`, units)
  }
}

export class MissingValueError extends MeasurementError {
  constructor(value: any) {
    super('Value is required', value)
    //this.flag = 'MissingValue'
    this.value = null;
  }
}

// the value passed is expected to be a flag
export class ProviderValueError extends MeasurementError {
  constructor(value: any) {
    super('Provider flagged value', value)
    this.flag = value;
    this.value = null;
  }
}

export class HighValueError extends MeasurementError {
  constructor(value: number, maxValue: number) {
    super(`Value must be lower than ${maxValue}`, value)
    this.flag = 'HighValue';
    // leave the value alone
  }
}

export class LowValueError extends MeasurementError {
  constructor(value: number, maxValue: number) {
    super(`Value must be lower than ${maxValue}`, value)
    this.flag = 'LowValue'
    // leave the value alone
  }
}
