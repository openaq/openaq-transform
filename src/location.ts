import { Sensor, SensorDefinition } from "./sensor";
import { System } from "./system";
import { stripNulls } from "./utils";


interface Coordinates {
    lat: number,
    lon: number,
    proj: string,
}

export class Location {

    location_id: string; // the ingest id
    site_id: string
    owner: string | undefined;
    label: string | undefined;
    coordinates: Coordinates
    ismobile: boolean | undefined;
    metadata: any; // TODO
    systems: { [key: string]: any; }

    constructor(data) {
        // data values should be keyed correctly by now
        this.location_id = data.location_id;
        this.site_id = data.site_id
        this.site_name = data.site_name
        this.coordinates = {
            lat: data.lat,
            lon: data.lon,
            proj: data.proj,
        }
        this.owner = data.owner
        this.ismobile = data.ismobile;
        this.systems = {};
    }

    /**
     * Get one of the sensor systems by data/key
     * If the system does not exist it will be created
     * @param {(string|object)} data - object with data or key value
     * @returns {*} - system object
     */
    getSystem(data: SensorDefinition | string ) : System {
        let key;
        if (typeof(data) === 'string') {
            key = data;
            data = { systemId: key };
        } else {
            key = data.systemId;
        }
        if (!this.systems[key]) {
            this.systems[key] = new System({ ...data });
        }
        return this.systems[key];
    }

    /**
     *  Add a new sensor to a location
     * This will also add the system as well if doesnt exist
     * @param {*} sensor - object that contains all the sensor data
     * @returns {*} - a sensor object
     */
    add(sensor: SensorDefinition) : Sensor {
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
            location_id: this.location_id,
            site_id: this.site_id,
            site_name: this.site_name,
            coordinates: this.coordinates,
            ismobile: this.ismobile,
            systems: Object.values(this.systems).map((s) => s.json()),
        });
    }
}
