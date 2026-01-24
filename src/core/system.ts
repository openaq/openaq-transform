import debug from "debug";

const log = debug("openaq-transform systems: DEBUG");

import type { SystemData, SystemJSON } from "../types/system";
import type { Sensor } from "./sensor";
import { stripNulls } from "./utils";

export class System {
	locationKey: string;
	manufacturerName: string;
	modelName: string;
	metadata: { [key: string]: any };
	#sensors: Map<string, Sensor>;

	constructor(data: SystemData) {
		log(`Adding new system`);
		this.locationKey = data.locationKey;
		this.manufacturerName = data.manufacturerName ?? "default";
		this.modelName = data.modelName ?? "default";
		this.#sensors = new Map<string, Sensor>();
		this.metadata = {};
	}

	get sensors() {
		return this.#sensors;
	}

	get key(): string {
		const key = [this.locationKey];
		if (this.manufacturerName !== "default") key.push(this.manufacturerName);
		if (this.modelName !== "default") key.push(this.modelName);
		return key.join("-");
	}

	add(sensor: Sensor): Sensor {
		log(`adding sensor (${sensor.key}) to system (${this.key})`);
		this.#sensors.set(sensor.key, sensor);
		return sensor;
	}

	json(): SystemJSON {
		return stripNulls({
			key: this.key,
			manufacturer_name: this.manufacturerName,
			model_name: this.modelName,
			sensors: Array.from(this.#sensors.values(), (s) => s.json()),
		});
	}
}
