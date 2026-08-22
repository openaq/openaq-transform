import { createDebug } from "obug";

const log = createDebug("openaq-transform:core:system");

import type { Sensor } from "./sensor";
import type { SystemData, SystemJSON } from "./types/system";
import { sanitizeKeyName, stripNulls } from "./utils";

export class System {
	locationKey: string;
	manufacturerName?: string;
	modelName?: string;
	metadata: Record<string, unknown>;
	#sensors: Map<string, Sensor>;

	constructor(data: SystemData) {
		log(`Adding new system`);
		this.locationKey = data.locationKey;
		this.manufacturerName = sanitizeKeyName(data.manufacturerName);
		this.modelName = sanitizeKeyName(data.modelName);
		this.#sensors = new Map<string, Sensor>();
		this.metadata = {};
	}

	get sensors() {
		return this.#sensors;
	}

	static createKey(data: {
		locationKey: string;
		manufacturerName?: string;
		modelName?: string;
	}): string {
		const manufacturerName = sanitizeKeyName(data.manufacturerName);
		const modelName = sanitizeKeyName(data.modelName);
		const key = [data.locationKey];
		const instrument = [];
		if (data.manufacturerName) instrument.push(manufacturerName);
		if (data.modelName) instrument.push(modelName);
		const instrumentKey = instrument.join("::");
		if (instrumentKey) key.push(instrumentKey);
		return key.join("/");
	}

	get key(): string {
		return System.createKey({
			locationKey: this.locationKey,
			manufacturerName: this.manufacturerName,
			modelName: this.modelName,
		});
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
