import debug from 'debug';
const log = debug('measurements: v2')

import { Datetime } from './datetime';
import { Sensor } from './sensor'
import type { BBox } from 'geojson';
import { Coordinates, updateBounds, CoordinatesJsonDefinition } from './coordinates';
import { ClientParametersDefinition, PARAMETER_DEFAULTS, Metric } from './metric';

import {
  TransformError,
  MissingAttributeError,
} from './errors';


export class Measurements {
  headers: string[];
  _measurements: Map<string, Measurement>;
  from?: Datetime;
  to?: Datetime;
  bounds?: BBox | null;
  parameters: Map<string, Metric>;

  constructor(parameters: ClientParametersDefinition = PARAMETER_DEFAULTS) {
    this._measurements = new Map<string, Measurement>();
    this.headers = [
      'sensor_id',
      'measure',
      'timestamp',
      'longitude',
      'latitude',
    ];
    // build a map that goes from the client parameter key
    // to the api parameter
    this.parameters = new Map()
    Object.entries(parameters).forEach(([providerKey, { parameter, unit }]) => {
      this.parameters.set(providerKey, new Metric(parameter, unit))
    });
  }

  parameterKeys() {
    return Array.from(this.parameters.keys());
  }

  metricFromProviderKey(key: string) {
    return this.parameters.get(key)
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

    log(`Adding measurement (${measurement.id})/${measurement.value} to measurements (total: ${this.length})`)
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
        sensor_id: m.sensor?.id,
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
  sensor: Sensor;
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
  //sensorId: string; // revisit for possible rename to 'key'
  sensor: Sensor
  timestamp: Datetime;
  value: number | null;
  coordinates?: Coordinates;
  flags?: Array<string>
  //units: string;

  constructor(params: MeasurementDefinition) {

    if (!params.sensor) throw new MissingAttributeError('sensor', params);
    if (!params.timestamp) throw new MissingAttributeError('timestamp', params);

    this.value = null;
    this.sensor = params.sensor;
    //this.sensorId = params.sensorId;
    this.timestamp = params.timestamp;
    // the csv parser does not convert values to numbers
    // should we do something here to do that?
    // the only issue I see is if we expect a flag here, in which case we could catch an error?
    // at this stage we only want to get everything organized
    // if we are sure that a flag was passed as a value we make it null
    // and then add a flag

    try {

      this.value = this.sensor?.metric.process(params.value)

    } catch (e: unknown) {
      // if the error includes a flag value we
      if (e instanceof TransformError) {
        if (e?.flag) {
          this.flags = [String(e.flag)]
        }
        this.value = e.value
      }
    }

    if (params.coordinates) {
      this.coordinates = params.coordinates;
    }
  }

  get id(): string {
    return `${this.sensor.id}-${this.timestamp.toString()}`
  }
}
