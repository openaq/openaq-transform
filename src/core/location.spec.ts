import { beforeEach, describe, expect, test } from "vitest";
import type { LocationData } from "../types/location";
import type { SystemData } from "../types/system";
import { Location, Locations } from "./location";
import { Sensor } from "./sensor";

function makeLocationData(overrides: Partial<LocationData> = {}): LocationData {
	return {
		provider: "example-provider",
		siteId: "42",
		siteName: "Test Site",
		owner: "Test Owner",
		label: "Test Label",
		status: "active",
		x: -0.18696,
		y: 5.60372,
		ismobile: false,
		...overrides,
	};
}

describe("Location", () => {
	test("builds a key from provider and siteId", () => {
		const location = new Location(makeLocationData());
		expect(location.key).toBe("example-provider/42");
	});

	test("creates a system when getSystem is called for the first time", () => {
		const location = new Location(makeLocationData());
		const system = location.getSystem({
			manufacturerName: "met-one",
			modelName: "bam-1022",
		} as SystemData);
		expect(system).toBeDefined();
		expect(location.systems.size).toBe(1);
	});

	test("reuses the same system on a second call with the same manufacturer/model", () => {
		const location = new Location(makeLocationData());
		const first = location.getSystem({
			manufacturerName: "met-one",
			modelName: "bam-1022",
		} as SystemData);
		const second = location.getSystem({
			manufacturerName: "met-one",
			modelName: "bam-1022",
		} as SystemData);
		expect(second).toBe(first);
		expect(location.systems.size).toBe(1);
	});

	test("adds a sensor to a system, creating the system as needed", () => {
		const location = new Location(makeLocationData());
		const system = location.getSystem({
			manufacturerName: "met-one",
			modelName: "bam-1022",
		} as SystemData);
		const sensor = new Sensor({
			systemKey: system.key,
			metric: { parameter: "pm25", unit: "ug/m3" },
		});
		location.add(sensor);
		expect(location.systems.size).toBe(1);
		expect(system.sensors.get(sensor.key)).toBe(sensor);
	});
});

describe("Locations", () => {
	let locations: Locations;

	beforeEach(() => {
		locations = new Locations();
	});

	test("starts empty", () => {
		expect(locations.length).toBe(0);
	});

	test("adds a location keyed by its own key", () => {
		const location = new Location(makeLocationData());
		locations.add(location);
		expect(locations.length).toBe(1);
		expect(locations.get(location.key)).toBe(location);
	});
});
