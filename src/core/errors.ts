

export const READ_ERROR = Symbol('Read error');
export const PARSE_ERROR = Symbol('Parse error');
export const MEASUREMENT_ERROR = Symbol('Measurement error');
export const LOCATION_ERROR = Symbol('Location error');
export const ADAPTER_ERROR = Symbol('Adapter error');
export const FETCHER_ERROR = Symbol('Fetcher error');
export const TRANSFORM_ERROR = Symbol('Transform error');


export class TransformError extends RangeError {
  constructor(message, value) {
    super(`${message} '${value}' was provided.`);
    this.name = this.constructor.name;
    this.type = TRANSFORM_ERROR
    this.value = value
  }

  toString() {
    return `${this.type.description}: ${this.message} ${this.cause}`
  }

}

export class LocationError extends TransformError {
  constructor(message: string, value: number) {
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


export class MeasurementError extends TransformError {
  constructor(message: string, value: number) {
    super(message, value)
    this.type = MEASUREMENT_ERROR;
    this.flag = null;
  }
}

export class MissingAttributeError extends MeasurementError {
  constructor(attribute: string) {
    super(`Missing '${attribute}' attribute.`)
  }
}

// provide the parameter
// return the parameters that we do support
export class UnsupportedParameterError extends MeasurementError {
  constructor(parameter) {
    super(`Parameter currently unsupported`, parameter)
  }
}

// provide the units and the parameter
// return what units we support in that parameter
export class UnsupportedUnitsError extends MeasurementError {
  constructor(parameter, units) {
    super(`Unsupported units for '${parameter}'.`, units)
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
