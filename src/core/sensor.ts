import debug from 'debug';
const log = debug('sensor: v2');

import { Flag } from './flag';
import { Metric } from './metric';
import { stripNulls } from './utils';
import type { FlagData, IndexedFlags } from '../types/flag';
import type { SensorData } from '../types/sensor';



export class Sensors {
  #sensors: Map<string, Sensor>;

  constructor() {
    this.#sensors = new Map<string, Sensor>();
  }

  add(sensor: Sensor) {
    this.#sensors.set(sensor.key, sensor);
  }

  get(sensorId: string): Sensor | undefined {
    return this.#sensors.get(sensorId);
  }

  has(sensorId: string): boolean {
    return this.#sensors.has(sensorId);
  }

  length(): number {
    return this.#sensors.size;
  }
}


export class Sensor {
  key: string;
  systemKey: string;
  metric: Metric;
  averagingIntervalSeconds: number;
  loggingIntervalSeconds: number;
  status: string;
  versionDate: string | undefined;
  instance: string | undefined;
  flags: IndexedFlags;

  constructor(data: SensorData) {
    log(`Adding new sensor: ${data.key}`);
    this.key = data.key;
    this.systemKey = data.systemKey;
    if (data.metric instanceof Metric) {
      this.metric = data.metric;
    } else {
      this.metric = new Metric(data.metric?.parameter, data.metric?.unit);
    }
    this.averagingIntervalSeconds = data.averagingIntervalSeconds;
    this.loggingIntervalSeconds =
      data.loggingIntervalSeconds ?? data.averagingIntervalSeconds;
    this.versionDate = data.versionDate;
    this.instance = data.instance;
    this.status = data.status;
    this.flags = {};
  }

  add(data: FlagData) {
    data.sensorId = this.key;
    const flag = new Flag(data);
    log(`adding flag (${flag.flagId}) to sensor (${this.key})`);
    this.flags[flag.flagId] = flag;
    return flag;
  }

  json() {
    return stripNulls({
      key: this.key,
      version_date: this.versionDate,
      status: this.status,
      instance: this.instance,
      parameter: this.metric.key,
      units: this.metric.parameter.units,
      averaging_interval_secs: this.averagingIntervalSeconds,
      logging_interval_secs: this.loggingIntervalSeconds,
      flags: Object.values(this.flags).map((s) => s.json()),
    });
  }
}
