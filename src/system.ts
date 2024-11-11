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
    manufacturerName: string | undefined;
    modelName: string | undefined;
    metadata: { [key: string]: any; } ;
    sensors: { [key: string]: Sensor; }; 

    constructor(data) {
        this.systemId = data.systemId;
        this.manufacturerName;
        this.modelName;
        this.metadata = {};
        this.sensors = {};
    }


    add(sensor: SensorDefinition) : Sensor {
        const sensorId = sensor.sensorId;
        if (!this.sensors[sensorId]) {
            this.sensors[sensorId] = new Sensor(sensor);
        }
        return this.sensors[sensorId];
    }


    json() {
        return stripNulls({
            systemId: this.systemId,
            manufacturerName: this.manufacturerName,
            modelName: this.modelName,
            sensors: Object.values(this.sensors).map((s) => s.json()),
        });
    }


}