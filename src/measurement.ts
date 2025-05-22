import { max, min } from 'date-fns';
import { Datetime } from './datetime';
import type { BBox } from 'geojson';
import { Coordinates, updateBounds } from './coordinates';
import { stripNulls } from './utils';
import { ParametersDefinition } from './constants';


export class Measurements {
  headers: string[];
  _measurements: Map<string, Measurement>;
  from?: Datetime;
  to?: Datetime;
  bounds: BBox | null;
  parameters: ParametersDefinition;

  constructor(parameters?: ParametersDefinition) {
    this._measurements = new Map<string, Measurement>();
    this.headers = [
      'sensor_id',
      'measure',
      'timestamp',
      'longitude',
      'latitude',
    ];
    this.bounds = null;
    !!parameters && (this.parameters = parameters)
  }

  measurands() {
    return this.parameters;
  }

  metricFromProviderKey(key: string) {
    return this.parameters[key]
  }

  add(measurement: Measurement) {
    this.bounds = updateBounds(measurement?.coordinates, this.bounds);

    this.to = measurement.greaterOf(this.to)
    this.from = measurement.lesserOf(this.from)

    console.debug(`adding measurement (${measurement.id}) to measurements (total: ${this.length})`)
    this._measurements.set(
      measurement.id,
      measurement
    );
  }


  get length(): number {
    return this._measurements.size;
  }

  json() {
    return Array.from(this._measurements.values(), (m) => {
      return stripNulls({
        sensor_id: m.sensorId,
        timestamp: m.timestamp.toString(),
        value: m.value,
        //units: m.units,
        coordinates: m.coordinates?.json(),
      });
    });
  }
}

interface MeasurementDefinition {
  sensorId: string;
  timestamp: Datetime;
  value: number;
  //units: string;
  coordinates: Coordinates;
}

export class Measurement {
  sensorId: string; // revisit for possible rename to 'key'
  timestamp: Datetime;
  value: number;
  //units: string;
  coordinates: Coordinates;

  constructor(params: MeasurementDefinition) {
    this.sensorId = params.sensorId;
    this.timestamp = params.timestamp;
    this.value = params.value;
    //this.units = params.units;
    this.coordinates = params.coordinates;
  }

  get id(): string {
    return `${this.sensorId}-${this.timestamp.toString()}`
  }
}
