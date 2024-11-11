import { Flag, FlagDefinition } from "./flag";
import { stripNulls } from "./utils";


export interface SensorDefinition {
    sensorId: string;
    parameter: string;
    intervalSeconds: number;
    versionDate: string;
    instance: string;
    status: string;
}


export class Sensor {


    sensorId: string;
    parameter: string  | undefined;
    intervalSeconds: number | undefined;
    versionDate: string | undefined;
    instance: string | undefined;
    status: string | undefined;
    flags: { [key: string]: Flag; } 


    constructor(data: SensorDefinition) {
        this.sensorId = data.sensorId;
        this.parameter;
        this.intervalSeconds;
        this.versionDate;
        this.instance;
        this.status;
        this.flags = {};
    }

    add(f: FlagDefinition) {
        f.sensorId = this.sensorId;
        const flag = new Flag(f);
        this.flags[flag.flagId] = flag;
        return flag;
    }

    json() {
        return stripNulls({
            sensor_id: this.sensorId,
            version_date: this.versionDate,
            status: this.status,
            instance: this.instance,
            parameter: this.parameter,
            interval_seconds: this.intervalSeconds,
            flags: Object.values(this.flags).map((s) => s.json()),
        });
    }
}
