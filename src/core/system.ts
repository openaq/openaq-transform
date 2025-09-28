import debug from 'debug';
const log = debug('systems: v2');

import { stripNulls } from './utils';
import { Sensor } from './sensor';
import type { SystemData, SystemJSON } from '../types/system';

export class Systems {
  #systems: Map<string, System>;

  constructor() {
    this.#systems = new Map<string, System>();
  }

  add(system: System) {
    this.#systems.set(system.key, system);
  }

  length() {
    return this.#systems.size;
  }
}

export class System {
  key: string;
  locationKey: string;
  manufacturerName: string;
  modelName: string;
  metadata: { [key: string]: any };
  #sensors: Map<string, Sensor>;

  constructor(data: SystemData) {
    this.key = data.key;
    this.locationKey = data.locationKey;
    this.manufacturerName = data.manufacturerName ?? 'default';
    this.modelName = data.modelName ?? 'default';
    this.#sensors = new Map<string, Sensor>();
    this.metadata = {};
  }

  get sensors() {
    return this.#sensors;
  }

  add(sensor: Sensor): Sensor {
    log(`adding sensor (${sensor.key}) to system (${this.key})`);
    this.#sensors.set(sensor.key, sensor);
    return sensor;
  }

  json(): SystemJSON {
    return stripNulls({
      key: this.key,
      manufacturer_name: this.manufacturerName,
      model_name: this.modelName,
      sensors: Array.from(this.#sensors.values(), (s) => s.json()),
    });
  }
}
