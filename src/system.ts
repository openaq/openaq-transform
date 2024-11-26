import { Sensor, SensorDefinition } from "./sensor";
import { stripNulls } from "./utils";



export interface SystemDefinition {
    systemId: number;
    manufacturerName: string;
    modelName: string;
    sensors: { [key: string]: Sensor; };
}

export class System {

    systemId: number;
    manufacturerName: string = 'default';
    modelName: string = 'default';
    metadata: { [key: string]: any; } ;
    sensors: { [key: string]: Sensor; };

    constructor(data) {
        this.systemId = data.systemId;
        this.manufacturerName;
        this.modelName;
        this.metadata = {};
        this.sensors = {};
    }

    get id() {
        return this.systemId;
    }

    add(sensor: SensorDefinition) : Sensor {
        const sensorId = sensor.sensorId;
        if (!this.sensors[sensorId]) {
            console.debug('adding new sensor', sensorId)
            this.sensors[sensorId] = new Sensor(sensor);
        }
        return this.sensors[sensorId];
    }


    json() {
        return stripNulls({
            system_id: this.systemId,
            manufacturer_name: this.manufacturerName,
            model_name: this.modelName,
            sensors: Object.values(this.sensors).map((s) => s.json()),
        });
    }


}
