import { Sensor, SensorDefinition } from "./sensor";
import { System } from "./system";
import { stripNulls } from "./utils";


export class Location {

    location_id: number;
    owner: string | undefined;
    label: string | undefined;
    proj: string
    lat: number | undefined;
    lon: number | undefined;
    ismobile: boolean | undefined;
    metadata: any; // TODO
    systems: { [key: string]: any; }

    constructor(data) {
        // data values should be keyed correctly by now
        this.location_id = data.location_id;
        this.owner = data.owner
        this.label = data.label
        this.coordiates = {
            lat: data.lat,
            lon: data.lon,
            proj: data.proj,
        }
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
            location: this.location_id,
            label: this.label,
            lat: this.lat,
            lon: this.lon,
            ismobile: this.ismobile,
            metadata: this.metadata,
            systems: Object.values(this.systems).map((s) => s.json()),
        });
    }
}
