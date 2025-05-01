import { BBox } from 'geojson';
import { stripNulls } from './utils';
import { System, SystemDefinition } from './system';
import { Sensor, SensorDefinition } from './sensor';
import { Coordinates, updateBounds } from './coordinates';

interface LocationDefinition {
  locationId: string;
  siteId: string;
  siteName: string;
  owner: string;
  label: string;
  x: number;
  y: number;
  projection?: string;
  ismobile: boolean;
  status: string;
  averagingIntervalSeconds?: number
  loggingIntervalSeconds?: number
}

export class Locations {
  _locations: Map<string, Location>;
  bounds: BBox | null;

  constructor() {
    this._locations = new Map<string, Location>();
    this.bounds = null; // its easier to work with a null boundary than the 4 number infinity boundary
  }

  add(location: Location) {
    this.bounds = updateBounds(location?.coordinates, this.bounds);
    this._locations.set(location.locationId, location);
  }

  get(locationId: string) {
    return this._locations.get(locationId);
  }

  get length() {
    return this._locations.size;
  }

  json() {
    return Array.from(this._locations.values(), (l) => {
      return l.json();
    });
  }
}

export class Location {
  locationId: string; // the ingest id
  siteId: string;
  siteName: string;
  owner: string | undefined;
  label: string | undefined;
  coordinates: Coordinates;
  ismobile: boolean | undefined;
  // for setting periods at the location level
  // not required because a provider could have a sensor file
  // and the data could be passed directly to the sensor
  averagingIntervalSeconds?: number;
  loggingIntervalSeconds?: number;
  sensorStatus?: string;

  _systems: Map<string, System>;

  constructor(data: LocationDefinition) {
    console.debug(`New location: ${data.locationId}`)
    const coordinates = new Coordinates(Number(data.x), Number(data.y), data.projection);
    this.locationId = data.locationId;
    this.siteId = data.siteId;
    this.siteName = data.siteName;
    this.averagingIntervalSeconds = data.averagingIntervalSeconds;
    this.loggingIntervalSeconds =
      data.loggingIntervalSeconds ?? data.averagingIntervalSeconds;
    this.sensorStatus = data.status;
    this.coordinates = coordinates;
    this.owner = data.owner;
    this.ismobile = data.ismobile;

    this._systems = new Map<string, System>();
  }

  get id() {
    return this.locationId;
  }

  get systems() {
    return this._systems;
  }

  addSystem(system: System) {
    this._systems.set(system.id, system);
  }

  /**
   * Get one of the sensor systems by data/key
   * If the system does not exist it will be created
   * @param {(string|object)} data - object with data or key value
   * @returns {*} - system object
   */
  getSystem(data: SystemDefinition | string): System {
    let key;
    if (typeof data === 'string') {
      key = data;
      data = { systemId: Number(key) }; // this needs better type coercion
    } else {
      key = data.systemId;
    }
    if (!this._systems.has(key)) {
      this.addSystem(new System(data));
    }
    return this._systems.get(key);
  }

  /**
   *  Add a new sensor to a location
   * This will also add the system as well if doesnt exist
   * @param {*} sensor - object that contains all the sensor data
   * @returns {*} - a sensor object
   */
  add(sensor: Sensor): Sensor {
    console.debug(`adding sensor (${sensor.id}) to location (${this.id})`)
    // first we get the system name
    // e.g. :provider/:site/:manufacturer-:model
    const sys = this.getSystem(sensor);
    return sys.add(sensor);
  }

  /**
   * Export method to convert to json
   */
  json() {
    return stripNulls({
      location_id: this.locationId,
      site_id: this.siteId,
      site_name: this.siteName,
      coordinates: this.coordinates.json(),
      ismobile: this.ismobile,
      systems: Array.from(this._systems.values(), (s) => s.json()),
    });
  }
}
