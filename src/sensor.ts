import { Flag, FlagDefinition } from "./flag";
import { stripNulls } from "./utils";
import { Measurand } from './measurand';


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
    metric: Measurand;
    averagingIntervalSeconds: number;
    loggingIntervalSeconds: number;
    status: string;
    versionDate: string | undefined;
    instance: string | undefined;
    flags: { [key: string]: Flag; }


    constructor(data: SensorDefinition) {
        this.sensorId = data.sensorId;
        this.metric = data.metric;
        this.averagingIntervalSeconds = data.averagingIntervalSeconds;
        this.loggingIntervalSeconds = data.loggingIntervalSeconds ?? data.averagingIntervalSeconds;
        this.versionDate = data.versionData;
        this.instance = data.instance;
        this.status = data.status;
        this.flags = {};

        // add excpetions
    }

    get id() {
        return this.sensorId;
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
            parameter: this.metric.internalParameter,
            units: this.metric.unit,
            averaging_interval_secs: this.averagingIntervalSeconds,
            logging_interval_secs: this.loggingIntervalSeconds,
            flags: Object.values(this.flags).map((s) => s.json()),
        });
    }
}
