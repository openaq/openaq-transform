import { describe, test, expect } from "vitest";
import { Sensor, Sensors } from "./sensor";

const systemKey = "example-provider/42/met-one::bam-1022";

function makeSensorData(overrides: Partial<any> = {}) {
	return {
		systemKey,
		metric: { parameter: "pm25", unit: "ug/m3" },
		...overrides,
	};
}

describe("Sensor", () => {
	test("builds a key from systemKey and metric", () => {
		const sensor = new Sensor(makeSensorData() as any);
		expect(sensor.key).toBe(`${systemKey}/pm25:mass`);
	});

	test("defaults loggingIntervalSeconds to averagingIntervalSeconds", () => {
		const sensor = new Sensor(makeSensorData({ averagingIntervalSeconds: 3600 }) as any);
		expect(sensor.loggingIntervalSeconds).toBe(3600);
	});

	test("createKey throws when systemKey is missing", () => {
		expect(() =>
			Sensor.createKey({ metric: { parameter: "pm25", unit: "ug/m3" } } as any)
		).toThrow();
	});

	test("createKey matches the instance getter", () => {
		const data = makeSensorData();
		const sensor = new Sensor(data as any);
		expect(Sensor.createKey(data as any)).toBe(sensor.key);
	});

	test("adds a flag and stores it under its own key", () => {
		const sensor = new Sensor(makeSensorData() as any);
		const flag = sensor.add({ value: "high" } as any);
		expect(sensor.flags.get(flag.key)).toBe(flag);
	});
});

describe("Sensors", () => {
	test("adds a sensor keyed by its own key", () => {
		const sensors = new Sensors();
		const sensor = new Sensor(makeSensorData() as any);
		sensors.add(sensor);
		expect(sensors.length).toBe(1);
		expect(sensors.get(sensor.key)).toBe(sensor);
	});
});