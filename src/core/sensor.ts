import debug from "debug";

const log = debug("openaq-transform sensor: DEBUG");

import type { FlagData, FlagInput } from "../types/flag";
import type { SensorData, SensorJSON, SensorKeyData } from "../types/sensor";
import { Flag } from "./flag";
import { Metric } from "./metric";
import { stripNulls } from "./utils";

export class Sensors {
	#sensors: Map<string, Sensor>;

	constructor() {
		this.#sensors = new Map<string, Sensor>();
	}

	add(sensor: Sensor) {
		this.#sensors.set(sensor.key, sensor);
	}

	get(key: string): Sensor | undefined {
		return this.#sensors.get(key);
	}

	has(key: string): boolean {
		return this.#sensors.has(key);
	}

	get length(): number {
		return this.#sensors.size;
	}

	get flagsLength(): number {
		let total = 0;
		for (const sensor of this.#sensors.values()) {
			total += sensor.flags.size;
		}
		return total;
	}
}

export class Sensor {
	// key: string;
	systemKey: string;
	metric: Metric;
	averagingIntervalSeconds?: number;
	loggingIntervalSeconds?: number;
	status?: string;
	versionDate?: string | undefined;
	instance?: string | undefined;
	flags: Map<string, Flag>;

	constructor(data: SensorData) {
		log(`Adding new sensor`);
		this.systemKey = data.systemKey;
		if (data.metric instanceof Metric) {
			this.metric = data.metric;
		} else {
			this.metric = new Metric(data.metric?.parameter, data.metric?.unit);
		}

		this.averagingIntervalSeconds = data.averagingIntervalSeconds;
		this.loggingIntervalSeconds =
			data.loggingIntervalSeconds ?? data.averagingIntervalSeconds;
		this.versionDate = data.versionDate;
		this.instance = data.instance;
		this.status = data.status;
		this.flags = new Map<string, Flag>();
	}

	static createKey(data: SensorKeyData): string {
		let { metric, instance, versionDate, systemKey } = data;
		if (!(metric instanceof Metric)) {
			metric = new Metric(metric?.parameter, metric?.unit);
		}
		const key = [metric.key];
		if (!systemKey) {
			throw new Error("System key is required to create a new sensor key");
		}
		if (instance) key.push(instance);
		if (versionDate) key.push(versionDate);
		//log('returning the sensor key', systemKey)
		return `${systemKey}-${key.join(":")}`;
	}

	add(data: FlagInput) {
		const flagData: FlagData = { ...data, sensorKey: this.key };
		const flag = new Flag(flagData);
		log(`adding flag (${flag.key}) to sensor (${this.key})`);
		this.flags.set(flag.key, flag);
		return flag;
	}

	get key(): string {
		// provider + location id
		const key = [this.metric.key];
		if (this.instance) key.push(this.instance);
		if (this.versionDate) key.push(this.versionDate);
		//log('returning the sensor key', this.systemKey)
		return `${this.systemKey}-${key.join(":")}`;
	}

	json(): SensorJSON {
		return stripNulls({
			key: this.key,
			version_date: this.versionDate,
			status: this.status,
			instance: this.instance,
			parameter: this.metric.key,
			units: this.metric.parameter.units,
			averaging_interval_secs: this.averagingIntervalSeconds,
			logging_interval_secs: this.loggingIntervalSeconds,
			flags: Array.from(this.flags.values(), (f) => f.json()),
		});
	}
}
