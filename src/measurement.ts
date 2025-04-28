import { max, min } from 'date-fns';
import { Datetime } from './datetime';
import { BBox } from 'geojson';
import { Coordinates } from './coordinates';
import { updateBounds } from './shared';
import { PARAMETERS, ParametersTransformDefinition } from './constants';


export class Measurements {
  headers: string[];
  _measurements: Map<string, Measurement>;
  from?: Date;
  to?: Date;
  bounds: BBox;

  constructor(parameters) {
    console.debug('creating measurements', parameters)
    this._measurements = new Map<string, Measurement>();
    this.headers = [
      'sensor_id',
      'measure',
      'timestamp',
      'longitude',
      'latitude',
    ];
    this.bounds = [Infinity, Infinity, -Infinity, -Infinity];
    this.parameters = parameters
  }

 measurands() {
   return this.parameters;
 }

 measurand(key) {
   return this.parameters[key]
 }

  add(measurement: Measurement) {
    console.debug('Adding measurement', measurement)
    this.updateBounds(measurement);

    // this.to = this.to
    //   ? max(this.to, measurement.timestamp)
    //   : measurement.timestamp;
    // this.from = this.from
    //   ? min(this.from, measurement.timestamp)
    //   : measurement.timestamp;

    console.log('adding measurement', `${measurement.sensorId}:${measurement.timestamp}`, measurement)
    this._measurements.set(
      `${measurement.sensorId}-${measurement.timestamp}`,
      measurement
    );
  }

  updateBounds(measurement: Measurement) {
    if(!measurement.coordinates) return;
    const {
      coordinates: { longitude, latitude },
    } = measurement;

    this.bounds = updateBounds(longitude, latitude, this.bounds);
  }

  get length() {
    return this._measurements.size;
  }

  json() {
    return Array.from(this._measurements.values(), (m) => {
        return {
          sensor_id: m.sensorId,
          timestamp: m.timestamp.toString(),
          value: m.value,
          units: m.units,
          coordinates: m.coordinates,
        };
      });
  }
}

interface MeasurementDefinition {
  sensorId: string;
  timestamp: Datetime;
  value: number;
  units: string;
  coordinates: Coordinates;
}

export class Measurement {
  sensorId: string; // revisit for possible rename to 'key'
  timestamp: Datetime;
  value: number;
  units: string;
  coordinates: Coordinates;

  constructor(params: MeasurementDefinition) {
    this.sensorId = params.sensorId;
    this.timestamp = params.timestamp;
    this.value = params.value;
    this.units = params.units;
    this.coordinates = params.coordinates;
  }
}
