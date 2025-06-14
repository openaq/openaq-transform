import { Flag, FlagDefinition } from "./flag";
import { Metric } from "./metric";
import { stripNulls } from "./utils";




export interface SensorDefinition {
    sensorId: string;
    systemId: string;
    metric: Metric;
    averagingIntervalSeconds: number;
    loggingIntervalSeconds: number;
    status: string;
    versionDate?: string;
    instance?: string;
}


export class Sensors {

    _sensors: Map<string, Sensor>;

    constructor() {
        this._sensors = new Map<string, Sensor>();
    }

    add(sensor: Sensor) {
        this._sensors.set(sensor.id, sensor);
    }

    get(sensorId: string): Sensor | undefined {
        return this._sensors.get(sensorId);
    }

    has(sensorId: string): boolean {
        return this._sensors.has(sensorId);
    }

    length(): number {
        return this._sensors.size;
    }
}


export class Sensor {

    sensorId: string;
    systemId: string;
    metric: Metric;
    averagingIntervalSeconds: number;
    loggingIntervalSeconds: number;
    status: string;
    versionDate: string | undefined;
    instance: string | undefined;
    flags: { [key: string]: Flag; }


    constructor(data: SensorDefinition) {
        this.sensorId = data.sensorId;
        this.systemId = data.systemId;
        this.metric = data.metric;
        this.averagingIntervalSeconds = data.averagingIntervalSeconds;
        this.loggingIntervalSeconds = data.loggingIntervalSeconds ?? data.averagingIntervalSeconds;
        this.versionDate = data.versionDate;
        this.instance = data.instance;
        this.status = data.status;
        this.flags = {};
    }

    get id() {
        return this.sensorId;
    }

    add(f: FlagDefinition) {
        f.sensorId = this.sensorId;
        const flag = new Flag(f);
        console.debug(`adding flag (${flag.flagId}) to sensor (${this.id})`)
        this.flags[flag.flagId] = flag;
        return flag;
    }

    json() {
        return stripNulls({
            sensor_id: this.sensorId,
            version_date: this.versionDate,
            status: this.status,
            instance: this.instance,
            parameter: this.metric.parameter,
            units: this.metric.unit,
            averaging_interval_secs: this.averagingIntervalSeconds,
            logging_interval_secs: this.loggingIntervalSeconds,
            flags: Object.values(this.flags).map((s) => s.json()),
        });
    }
}
