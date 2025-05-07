import { max, min } from 'date-fns';
import { Datetime } from './datetime';
import { BBox } from 'geojson';
import { Coordinates, updateBounds } from './coordinates';
import { stripNulls } from './utils';
import { ParametersDefinition } from './constants';


export class Measurements {
  headers: string[];
  _measurements: Map<string, Measurement>;
  from?: Date;
  to?: Date;
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

    this.to = this.to
      ? max([this.to, measurement.timestamp.toDate()])
      : measurement.timestamp.toDate();
    this.from = this.from
      ? min([this.from, measurement.timestamp.toDate()])
      : measurement.timestamp.toDate();

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
    // the csv parser does not convert values to numbers
    // should we do something here to do that?
    // the only issue I see is if we expect a flag here, in which case we could catch an error?
    this.value = params.value*1;
    //this.units = params.units;
    this.coordinates = params.coordinates;
  }

  get id(): string {
    return `${this.sensorId}-${this.timestamp}`
  }
}
