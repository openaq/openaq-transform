import { describe, expect, test } from "vitest";
import { Sensor } from "./sensor";
import { System } from "./system";

const locationKey = "example-provider/42";

describe("System", () => {
	test("stores manufacturerName and modelName when provided", () => {
		const system = new System({
			locationKey,
			manufacturerName: "met-one",
			modelName: "bam-1022",
		});
		expect(system.manufacturerName).toBe("met-one");
		expect(system.modelName).toBe("bam-1022");
	});

	test("treats missing manufacturerName/modelName as undefined", () => {
		const system = new System({ locationKey });
		expect(system.manufacturerName).toBeUndefined();
		expect(system.modelName).toBeUndefined();
	});

	test("sanitizes slashes and colons out of manufacturerName/modelName", () => {
		const system = new System({
			locationKey,
			manufacturerName: "met/one",
			modelName: "bam::1022",
		});
		expect(system.manufacturerName).toBe("met-one");
		expect(system.modelName).toBe("bam-1022");
	});

	test("builds a key from locationKey alone when no manufacturer/model", () => {
		const system = new System({ locationKey });
		expect(system.key).toBe(locationKey);
	});

	test("builds a key with manufacturer only", () => {
		const system = new System({
			locationKey,
			manufacturerName: "met-one",
		});
		expect(system.key).toBe(`${locationKey}/met-one`);
	});

	test("builds a key with manufacturer and model", () => {
		const system = new System({
			locationKey,
			manufacturerName: "met-one",
			modelName: "bam-1022",
		});
		expect(system.key).toBe(`${locationKey}/met-one::bam-1022`);
	});

	test("produces a clean key even when manufacturer/model contain delimiter characters", () => {
		const system = new System({
			locationKey,
			manufacturerName: "met/one",
			modelName: "bam::1022",
		});
		expect(system.key).toBe(`${locationKey}/met-one::bam-1022`);
	});

	test("createKey matches the instance getter", () => {
		const data = {
			locationKey,
			manufacturerName: "met-one",
			modelName: "bam-1022",
		};
		const system = new System(data);
		expect(System.createKey(data)).toBe(system.key);
	});

	test("adds a sensor keyed by its own key", () => {
		const system = new System({
			locationKey,
			manufacturerName: "met-one",
			modelName: "bam-1022",
		});
		const sensor = new Sensor({
			systemKey: system.key,
			metric: { parameter: "pm25", unit: "ug/m3" },
		});
		system.add(sensor);
		expect(system.sensors.get(sensor.key)).toBe(sensor);
	});
});
