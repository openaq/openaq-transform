import { describe, test, expect } from "vitest";
import { System } from "./system";

const locationKey = "example-provider/42";

describe("System", () => {
	test("stores manufacturerName and modelName when provided", () => {
		const system = new System({ locationKey, manufacturerName: "met-one", modelName: "bam-1022" } as any);
		expect(system.manufacturerName).toBe("met-one");
		expect(system.modelName).toBe("bam-1022");
	});

	test("treats missing manufacturerName/modelName as undefined", () => {
		const system = new System({ locationKey } as any);
		expect(system.manufacturerName).toBeUndefined();
		expect(system.modelName).toBeUndefined();
	});

	test("santestizes slashes and colons out of manufacturerName/modelName", () => {
		const system = new System({ locationKey, manufacturerName: "met/one", modelName: "bam::1022" } as any);
		expect(system.manufacturerName).toBe("met-one");
		expect(system.modelName).toBe("bam-1022");
	});

	test("builds a key from locationKey alone when no manufacturer/model", () => {
		const system = new System({ locationKey } as any);
		expect(system.key).toBe(locationKey);
	});

	test("builds a key wtesth manufacturer only", () => {
		const system = new System({ locationKey, manufacturerName: "met-one" } as any);
		expect(system.key).toBe(`${locationKey}/met-one`);
	});

	test("builds a key wtesth manufacturer and model", () => {
		const system = new System({ locationKey, manufacturerName: "met-one", modelName: "bam-1022" } as any);
		expect(system.key).toBe(`${locationKey}/met-one::bam-1022`);
	});

	test("produces a clean key even when manufacturer/model contain delimtester characters", () => {
		const system = new System({ locationKey, manufacturerName: "met/one", modelName: "bam::1022" } as any);
		expect(system.key).toBe(`${locationKey}/met-one::bam-1022`);
	});

	test("createKey matches the instance getter", () => {
		const data = { locationKey, manufacturerName: "met-one", modelName: "bam-1022" };
		const system = new System(data as any);
		expect(System.createKey(data)).toBe(system.key);
	});

	test("adds a sensor keyed by tests own key", () => {
		const system = new System({ locationKey, manufacturerName: "met-one", modelName: "bam-1022" } as any);
		const sensor = { key: `${system.key}/pm25`, json: () => ({}) } as any;
		system.add(sensor);
		expect(system.sensors.get(sensor.key)).toBe(sensor);
	});
});