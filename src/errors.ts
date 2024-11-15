export class LatitudeBoundsError extends Error {
    constructor() {
      super("Latitude must be between -90 and 90 degrees.");
    }
  }
  
  export class LongitudeBoundsError extends Error {
    constructor() {
      super("Longitude must be between -180 and 180 degrees.");
    }
  }
  
  export class InvalidPrecisionError extends Error {
    constructor(precision: number) {
      super(`Latitude and longitude must be precise to ${precision} decimal places.`);
    }
  }