import debug from 'debug';
const log = debug('systems: v2')

import { stripNulls } from './utils';
import { Sensor } from './sensor';

export interface SystemDefinition {
  systemId: string;
  locationId: string;
  manufacturerName?: string;
  modelName?: string;
}

export class Systems {
  _systems: Map<string, System>;

  constructor() {
    this._systems = new Map<string, System>();
  }

  add(system: System) {
    this._systems.set(system.systemId, system);
  }

  length() {
    return this._systems.size;
  }
}

export class System {
  systemId: string;
  locationId: string;
  manufacturerName: string;
  modelName: string;
  metadata: { [key: string]: any };
  _sensors: Map<string, Sensor>;

  constructor(data: SystemDefinition) {
    this.systemId = data.systemId;
    this.locationId = data.locationId;
    this.manufacturerName = data.manufacturerName ?? 'default';
    this.modelName = data.modelName ?? 'default';
    this._sensors = new Map<string, Sensor>();
    this.metadata = {};
  }

  get id() {
    return this.systemId;
  }

  get sensors() {
    return this._sensors;
  }

  add(sensor: Sensor): Sensor {
    log(`adding sensor (${sensor.id}) to system (${this.id})`)
    this._sensors.set(sensor.id, sensor)
    return sensor
  }

  json() {
    return stripNulls({
      system_id: this.systemId,
      manufacturer_name: this.manufacturerName,
      model_name: this.modelName,
      sensors: Array.from(this._sensors.values(), (s) => s.json()),
    });
  }
}
