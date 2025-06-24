import { Datetime } from './datetime';
import type { BBox } from 'geojson';
import { Coordinates, updateBounds, CoordinatesJsonDefinition } from './coordinates';
import { ParametersDefinition, PARAMETER_DEFAULTS } from './constants';


export class Measurements {
  headers: string[];
  _measurements: Map<string, Measurement>;
  from?: Datetime;
  to?: Datetime;
  bounds?: BBox | null;
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
      //this.bounds = null;
      this.parameters = parameters ?? PARAMETER_DEFAULTS;

  }

  measurands() {
    return this.parameters;
  }

  metricFromProviderKey(key: string) {
    return this.parameters[key]
  }

  add(measurement: Measurement) {
    if(measurement.coordinates) {
      this.bounds = updateBounds(measurement.coordinates, this.bounds);
    }

    if(this.to) {
      this.to = measurement.timestamp.greaterOf(this.to)
    } else {
      this.to = measurement.timestamp;
    }
    if(this.from) {
      this.from = measurement.timestamp.lesserOf(this.from)
    } else {
      this.from = measurement.timestamp
    }
    console.debug(`Adding measurement (${measurement.id})/${measurement.value} to measurements (total: ${this.length})`)
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
      const meas: MeasurementJsonDefinition = {
        sensor_id: m.sensorId,
        timestamp: m.timestamp.toString(),
        value: m.value,
      }
      if (m.flags) meas.flags = m.flags
      if (m.coordinates) meas['coordinates'] = m.coordinates.json()
      return meas
    });
  }
}

interface MeasurementDefinition {
  sensorId: string;
  timestamp: Datetime;
  value: number | null;
  coordinates?: Coordinates;
  flags?: Array<string>
  //units: string;
}

export interface MeasurementJsonDefinition {
  sensor_id: string;
  timestamp: string | undefined; // this is just temp to solve a typing issue
  value: number | null;
  coordinates?: CoordinatesJsonDefinition;
  flags?: Array<string>
}

export class Measurement {
  sensorId: string; // revisit for possible rename to 'key'
  timestamp: Datetime;
  value: number | null;
  coordinates?: Coordinates;
  flags?: Array<string>
  //units: string;

  constructor(params: MeasurementDefinition) {
    this.sensorId = params.sensorId;
    this.timestamp = params.timestamp;
    // the csv parser does not convert values to numbers
    // should we do something here to do that?
    // the only issue I see is if we expect a flag here, in which case we could catch an error?
    // at this stage we only want to get everything organized
    // if we are sure that a flag was passed as a value we make it null
    // and then add a flag
    if (params.value) {
      const v = +params.value
      if (Number.isFinite(v) && !([-99].includes(v))) {
        this.value = v;
      } else {
        this.flags = [String(params.value)];
        this.value = null;
      }
    } else {
      // missing value but no flag
      this.value = null;
    }
    //this.units = params.units;
    if (params.coordinates) {
      this.coordinates = params.coordinates;
    }
  }

  get id(): string {
    return `${this.sensorId}-${this.timestamp.toString()}`
  }
}
