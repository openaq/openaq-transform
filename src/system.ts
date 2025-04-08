import { stripNulls } from './utils';

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
  locationsId: string;
  manufacturerName: string;
  modelName: string;
  metadata: { [key: string]: any };
  _sensors: Set<string>;

  constructor(data: SystemDefinition) {
    this.systemId = data.systemId;
    this.locationsId = data.locationId;
    this.manufacturerName = data.manufacturerName ?? 'default';
    this.modelName = data.modelName ?? 'default';
    this._sensors = new Set<string>();
    this.metadata = {};
  }

  get id() {
    return this.systemId;
  }

  json() {
    return stripNulls({
      system_id: this.systemId,
      manufacturer_name: this.manufacturerName,
      model_name: this.modelName,
    //   sensors: Object.values(this.sensors).map((s) => s.json()),
    });
  }
}
