import { describe, expect, test } from "vitest";
import { Sensor, Sensors } from "./sensor";
import type { FlagInput } from "./types/flag";
import type { SensorData, SensorKeyData } from "./types/sensor";

const systemKey = "example-provider/42/met-one::bam-1022";

function makeSensorData(overrides: Partial<SensorData> = {}): SensorData {
	return {
		systemKey,
		metric: { parameter: "pm25", unit: "ug/m3" },
		...overrides,
	};
}

describe("Sensor", () => {
	test("builds a key from systemKey and metric", () => {
		const sensor = new Sensor(makeSensorData());
		expect(sensor.key).toBe(`${systemKey}/pm25:mass`);
	});

	test("defaults loggingIntervalSeconds to averagingIntervalSeconds", () => {
		const sensor = new Sensor(
			makeSensorData({ averagingIntervalSeconds: 3600 }),
		);
		expect(sensor.loggingIntervalSeconds).toBe(3600);
	});

	test("createKey throws when systemKey is missing", () => {
		const incomplete = {
			metric: { parameter: "pm25", unit: "ug/m3" },
		} as unknown as SensorKeyData;

		expect(() => Sensor.createKey(incomplete)).toThrow();
	});

	test("createKey matches the instance getter", () => {
		const data = makeSensorData();
		const sensor = new Sensor(data);
		expect(Sensor.createKey(data)).toBe(sensor.key);
	});

	test("adds a flag and stores it under its own key", () => {
		const sensor = new Sensor(makeSensorData());
		const flagInput: FlagInput = {
			starts: "2024-01-01T00:00:00Z",
			ends: "2024-01-01T01:00:00Z",
			flag: "high",
			note: "example flag",
		};
		const flag = sensor.add(flagInput);
		expect(sensor.flags.get(flag.key)).toBe(flag);
	});
});

describe("Sensors", () => {
	test("adds a sensor keyed by its own key", () => {
		const sensors = new Sensors();
		const sensor = new Sensor(makeSensorData());
		sensors.add(sensor);
		expect(sensors.length).toBe(1);
		expect(sensors.get(sensor.key)).toBe(sensor);
	});
});
