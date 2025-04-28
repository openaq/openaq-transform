import { BBox } from 'geojson';
import { updateBounds } from './shared';
import { stripNulls } from './utils';
import { Coordinates } from './coordinates';

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
  bounds: BBox;

  constructor() {
    this._locations = new Map<string, Location>();
    this.bounds = [Infinity, Infinity, -Infinity, -Infinity];
  }

  add(location: Location) {
    this.updateBounds(location);
    this._locations.set(location.locationId, location);
  }

  get(locationId: string) {
    return this._locations.get(locationId);
  }

  updateBounds(location: Location) {
    const {
      coordinates: { longitude, latitude },
    } = location;

    this.bounds = updateBounds(longitude, latitude, this.bounds);
  }

  get length() {
    return this._locations.size;
  }

  json() {
    return Array.from(this._locations.values(), (l) => {
      return { ...l };
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

  metadata: any; // TODO
  _systems: Set<string>;

  constructor(data: LocationDefinition) {
    const coordinates = new Coordinates(data.x, data.y, data.projection);
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
    this._systems = new Set<string>();
  }

  get id() {
    return this.locationId;
  }

  /**
   * Get one of the sensor systems by data/key
   * If the system does not exist it will be created
   * @param {(string|object)} data - object with data or key value
   * @returns {*} - system object
   */
  //   getSystem(data: SystemDefinition | string): System {
  //     let key;
  //     if (typeof data === 'string') {
  //       key = data;
  //       data = { systemId: Number(key) }; // this needs better type coercion
  //     } else {
  //       key = data.systemId;
  //     }
  //     if (!this.systems[key]) {
  //       this.systems[key] = new System(data);
  //     }
  //     return this.systems[key];
  //   }

  get systems() {
    return this._systems;
  }

  addSystem(systemId: string) {
    this._systems.add(systemId);
  }

  /**
   *  Add a new sensor to a location
   * This will also add the system as well if doesnt exist
   * @param {*} sensor - object that contains all the sensor data
   * @returns {*} - a sensor object
   */
  //   add(Sensor: SensorDefinition): Sensor {
  //     // first we get the system name
  //     // e.g. :provider/:site/:manufacturer-:model
  //     const sys = this.getSystem(sensor);
  //     return sys.add(sensor);
  //   }

  /**
   * Export method to convert to json
   */
  json() {
    return stripNulls({
      location_id: this.locationId,
      site_id: this.siteId,
      site_name: this.siteName,
      coordinates: this.coordinates,
      ismobile: this.ismobile,
      systems: Object.values(this.systems).map((s) => s.json()),
    });
  }
}
