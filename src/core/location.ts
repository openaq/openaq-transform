import debug from 'debug';
const log = debug('openaq-transform locations: DEBUG');

import type { BBox } from 'geojson';
import { stripNulls } from './utils';
import { System } from './system';
import { Sensor } from './sensor';
import { Coordinates, updateBounds } from './coordinates';
import type { LocationData, LocationKeyData, LocationJSON } from '../types/location';
import type { SystemData } from '../types/system';

export class Locations {
  #locations: Map<string, Location>;
  bounds: BBox | null;

  constructor() {
    this.#locations = new Map<string, Location>();
    this.bounds = null; // its easier to work with a null boundary than the 4 number infinity boundary
  }

  add(location: Location) {
    if (location.coordinates) {
      this.bounds = updateBounds(location.coordinates, this.bounds);
    }
    this.#locations.set(location.key, location);
  }

  get(locationKey: string): Location | undefined {
    //const key = `${this.provider}-${siteId}`
    //log('checking for location', key);
    return this.#locations.get(locationKey);
  }

  get length(): number {
    return this.#locations.size;
  }

  get systemsLength(): number {
    let total = 0;
    for (const location of this.#locations.values()) {
      total += location.systems.size;
    }
    return total;
  }

  get sensorsLength(): number {
    let total = 0;
    for (const location of this.#locations.values()) {
      for (const system of location.systems.values()) {
        total += system.sensors.size;
      }
    }
    return total;
  }

  json() {
    return Array.from(this.#locations.values(), (l) => {
      return l.json();
    });
  }
}

export class Location {
  provider: string;
  siteId: string;
  siteName: string;
  owner: string | undefined;
  label: string | undefined;
  coordinates: Coordinates;
  ismobile: boolean;
  // for setting periods at the location level
  // not required because a provider could have a sensor file
  // and the data could be passed directly to the sensor
  averagingIntervalSeconds?: number;
  loggingIntervalSeconds?: number;
  sensorStatus?: string;

  #systems: Map<string, System>;

  constructor(data: LocationData) {
    log(`Adding new location: ${data.siteId}`);
    const coordinates = new Coordinates(
      Number(data.x),
      Number(data.y),
      data.projection
    );
    //this.key = data.key;
    this.siteId = data.siteId;
    this.siteName = data.siteName;
    this.averagingIntervalSeconds = data.averagingIntervalSeconds;
    this.loggingIntervalSeconds =
      data.loggingIntervalSeconds ?? data.averagingIntervalSeconds;
    this.sensorStatus = data.status;
    this.coordinates = coordinates;
    this.owner = data.owner;
    this.ismobile = data.ismobile;
    this.provider = data.provider

    this.#systems = new Map<string, System>();
  }

  static createKey(data: LocationKeyData): string {
    const provider = data.provider;
    const siteId = data.siteId;
    if (!(provider && siteId)) {
      throw new Error(`Both a provider and siteId value are required to build a location key: You provided ${provider} & ${siteId}`);
    }
    return `${provider}-${siteId}`
  }

  get key(): string {
    // provider + location id
    return Location.createKey({ provider: this.provider, siteId: this.siteId });
  }

  get systems() {
    return this.#systems;
  }

  addSystem(system: System) {
    const key = system.key;
    this.#systems.set(key, system);
  }

  /**
   * Get one of the sensor systems by data/key
   * If the system does not exist it will be created
   * @param {(string|object)} data - object with data or key value
   * @returns {*} - system object
   */
  getSystem(data: SystemData | Sensor): System {
    let key: string;
    if (data instanceof Sensor) {
      key = data.systemKey;
    } else {
      const parts = [this.key];
      if (data.manufacturerName) parts.push(data.manufacturerName)
      if (data.modelName) parts.push(data.modelName)
      key = parts.join('-')
    }

    if (!this.#systems.has(key)) {
      // We are not runing into this anywhere in our tests
      // so we either need to think of a reason to keep it or
      // we should probably remove it

      this.addSystem(
        new System({
          locationKey: this.key,
          modelName: 'modelName' in data ? data.modelName : 'default',
          manufacturerName:
            'manufacturerName' in data ? data.manufacturerName : 'default',
        })
      );
    }

    const sys = this.#systems.get(key);
    if (!sys) throw new TypeError(`Could not get system - ${key}`);

    return sys;
  }

  /**
   *  Add a new sensor to a location
   * This will also add the system as well if doesnt exist
   * @param {*} sensor - object that contains all the sensor data
   * @returns {*} - a sensor object
   */
  add(sensor: Sensor): Sensor {
    log(`adding sensor (${sensor.key}) to location (${this.key})`);
    // first we get the system name
    // e.g. :provider/:site/:manufacturer-:model
    const sys = this.getSystem(sensor);
    return sys.add(sensor);
  }

  /**
   * Export method to convert to json
   */
  json(): LocationJSON {
    return stripNulls({
      key: this.key,
      site_id: this.siteId,
      site_name: this.siteName,
      coordinates: this.coordinates.json(),
      ismobile: this.ismobile,
      systems: Array.from(this.#systems.values(), (s) => s.json()),
    });
  }
}
