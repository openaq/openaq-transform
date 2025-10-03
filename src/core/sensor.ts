import debug from 'debug';
const log = debug('sensor: DEBUG');

import { Flag } from './flag';
import { Metric } from './metric';
import { stripNulls } from './utils';
import type { FlagData, IndexedFlags } from '../types/flag';
import type { SensorData, SensorJSON } from '../types/sensor';



export class Sensors {
  #sensors: Map<string, Sensor>;

  constructor() {
    this.#sensors = new Map<string, Sensor>();
  }

  add(sensor: Sensor) {
    this.#sensors.set(sensor.key, sensor);
  }

  get(key: string): Sensor | undefined {
    return this.#sensors.get(key);
  }

  has(key: string): boolean {
    return this.#sensors.has(key);
  }

  length(): number {
    return this.#sensors.size;
  }
}


export class Sensor {
 // key: string;
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
    //this.key = data.key;
    this.systemKey = data.systemKey;
    if (data.metric instanceof Metric) {
      this.metric = data.metric;
    } else {
      this.metric = new Metric(data.metric?.parameter, data.metric?.unit);
    }
    this.system =
    this.averagingIntervalSeconds = data.averagingIntervalSeconds;
    this.loggingIntervalSeconds =
      data.loggingIntervalSeconds ?? data.averagingIntervalSeconds;
    this.versionDate = data.versionDate;
    this.instance = data.instance;
    this.status = data.status;
    this.flags = {};
  }

  add(data: FlagData) {
    data.key = this.key;
    const flag = new Flag(data);
    log(`adding flag (${flag.key}) to sensor (${this.key})`);
    this.flags[flag.key] = flag;
    return flag;
  }

  get key(): string {
    // provider + location id
    const key = [this.metric.key]
    if (this.instance) key.push(this.instance)
    if (this.versionDate) key.push(this.versionDate)
    //log('returning the sensor key', this.systemKey)
    return `${this.systemKey}-${key.join(':')}`;
  }

  json(): SensorJSON {
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
