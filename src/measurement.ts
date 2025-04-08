import { max, min } from 'date-fns';
import { Datetime } from './datetime';
import { BBox } from 'geojson';
import { Coordinates } from './coordinates';
import { updateBounds } from './shared';

export class Measurements {
  headers: string[];
  _measurements: Map<string, Measurement>;
  from?: Date;
  to?: Date;
  bounds: BBox;

  constructor() {
    this._measurements = new Map<string, Measurement>();
    this.headers = [
      'sensor_id',
      'measure',
      'timestamp',
      'longitude',
      'latitude',
    ];
    this.bounds = [Infinity, Infinity, -Infinity, -Infinity];
  }

  add(measurement: Measurement) {
    this.updateBounds(measurement);

    this.to = this.to
      ? max(this.to, measurement.timestamp)
      : measurement.timestamp;
    this.from = this.from
      ? min(this.from, measurement.timestamp)
      : measurement.timestamp;

    this._measurements.set(
      `${measurement.sensorId}-${measurement.timestamp}`,
      measurement
    );
  }

  updateBounds(measurement: Measurement) {
    const {
      coordinates: { longitude, latitude },
    } = measurement;

    this.bounds = updateBounds(longitude, latitude, this.bounds);
  }

  get length() {
    return this._measurements.size;
  }

  json() {
    return Array.from(this._measurements, (m) => {
        return { ...m };
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
