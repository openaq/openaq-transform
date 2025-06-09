export class LatitudeBoundsError extends Error {
  constructor() {
    super('Latitude must be between -90 and 90 degrees.');
  }
}

export class LongitudeBoundsError extends Error {
  constructor() {
    super('Longitude must be between -180 and 180 degrees.');
  }
}

export class InvalidPrecisionError extends Error {
  constructor(precision: number) {
    super(
      `Latitude and longitude must be precise to ${precision} decimal places.`
    );
  }
}

export class MissingValueError extends Error {
    constructor(message: string) {
        super('Missing value error: ' + message)
        this.name = 'MissingValueError';
    }
}

export class MissingSensorError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'MissingSensorError';
    }
}
