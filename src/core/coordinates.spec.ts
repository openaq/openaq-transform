import fc from "fast-check";
import type { BBox } from "geojson";
import proj4 from "proj4";
import { describe, expect, test } from "vitest";
import { Coordinates, updateBounds } from "./coordinates";
import { InvalidPrecisionError } from "./errors";

describe("Coordinates", () => {
	test("Coordinates latitude and longitude return unchanged value for EPSG:4326", () => {
		const coordinates = new Coordinates(32, 42);
		expect(coordinates.longitude).toBe(32);
		expect(coordinates.latitude).toBe(42);
	});

	test("Coordinates latitude and longitude return unchanged value for WGS84", () => {
		const coordinates = new Coordinates(32, 42, "WGS84");
		expect(coordinates.longitude).toBe(32);
		expect(coordinates.latitude).toBe(42);
	});

	test("Coordinates latitude and longitude return correct lat/lng value for projection with predefined alias", () => {
		const coordinates = new Coordinates(
			-6796397.777,
			1644767.5597,
			"EPSG:3857",
		);
		expect(coordinates.latitude).toBe(14.614111000419951);
		expect(coordinates.longitude).toBe(-61.05308000035039);
	});

	test("Coordinates latitude and longitude return correct lat/lng value for custom projection", () => {
		proj4.defs(
			"EPSG:26913",
			"+proj=utm +zone=13 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
		);
		const coordinates = new Coordinates(349546.85, 3883647.83, "EPSG:26913");
		expect(coordinates.latitude).toBe(35.08439434007085);
		expect(coordinates.longitude).toBe(-106.65039003708863);
	});

	test("Coordinates json() method returns correct structure and values for WGS84", () => {
		const coordinates = new Coordinates(75.0, 15.0);
		const jsonOutput = coordinates.json();
		expect(jsonOutput).toEqual({
			latitude: 15.0,
			longitude: 75.0,
			proj: "EPSG:4326",
		});
	});

	test("Coordinates json() method returns correct structure and values for projected coordinates", () => {
		const coordinates = new Coordinates(
			-6796397.777,
			1644767.5597,
			"EPSG:3857",
		);
		const jsonOutput = coordinates.json();
		expect(jsonOutput.latitude).toBe(14.614111000419951);
		expect(jsonOutput.longitude).toBe(-61.05308000035039);
		expect(jsonOutput.proj).toBe("EPSG:4326");
	});

	test("Coordinates fail when latitude is null", () => {
		// @ts-expect-error Testing null input validation
		expect(() => new Coordinates(20, null)).toThrowError(/Latitude/);
	});

	test("Coordinates fail when longitude is null", () => {
		// @ts-expect-error Testing null input validation
		expect(() => new Coordinates(null, 20)).toThrowError(/Longitude/);
	});

	test("Coordinates fail when projection is invalid", () => {
		expect(() => new Coordinates(20, 20, "WSG84")).toThrowError(/PROJ4/);
	});

	test("Coordinates throws longitude out of bounds", () => {
		expect(() => new Coordinates(200, 20)).toThrowError(/Longitude/);
	});

	test("Coordinates throws latitude out of bounds", () => {
		expect(() => new Coordinates(20, 200)).toThrowError(/Latitude/);
	});

	test("Coordinates throws precision default error", () => {
		expect(() => new Coordinates(172.12, 85.12, "EPSG:4326", 3)).toThrowError(
			/precise/,
		);
	});

	test("Coordinates with inprecise y throws precision default error", () => {
		expect(() => new Coordinates(172.123, 85.12, "EPSG:4326", 3)).toThrowError(
			/precise/,
		);
	});

	test("WGS84 coordinates are always within lat/lon bounds, or throw", () => {
		fc.assert(
			fc.property(
				fc.double({ min: -200, max: 200, noNaN: true }).filter((n) => n !== 0),
				fc.double({ min: -200, max: 200, noNaN: true }).filter((n) => n !== 0),
				(x, y) => {
					try {
						const c = new Coordinates(x, y, "EPSG:4326");
						expect(c.latitude).toBeGreaterThanOrEqual(-90);
						expect(c.latitude).toBeLessThanOrEqual(90);
						expect(c.longitude).toBeGreaterThanOrEqual(-180);
						expect(c.longitude).toBeLessThanOrEqual(180);
					} catch (e) {
						expect(e).toBeInstanceOf(Error);
					}
				},
			),
		);
	});

	test("a coordinate with too few decimal places than precision throws InvalidPrecisionError", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 6 }),
				fc.integer({ min: -179, max: 179 }),
				fc.integer({ min: -89, max: 89 }),
				(precision, x, y) => {
					expect(() => new Coordinates(x, y, "EPSG:4326", precision)).toThrow(
						InvalidPrecisionError,
					);
				},
			),
		);
	});
});

const finiteCoordArbitrary = fc
	.record({
		x: fc.double({ min: -180, max: 180, noNaN: true }).filter((n) => n !== 0),
		y: fc.double({ min: -90, max: 90, noNaN: true }).filter((n) => n !== 0),
	})
	.map(({ x, y }) => new Coordinates(x, y, "EPSG:4326", 0));

describe("updateBounds", () => {
	test("updateBounds initializes bounds correctly when null", () => {
		const coords = new Coordinates(10, 20);
		const newBounds = updateBounds(coords, null);
		expect(newBounds).toEqual([10, 20, 10, 20]);
	});

	test("updateBounds initializes bounds correctly when undefined", () => {
		const coords = new Coordinates(-5, -15);
		const newBounds = updateBounds(coords, undefined);
		expect(newBounds).toEqual([-5, -15, -5, -15]);
	});

	test("min/max on each axis are independently correct after folding an arbitrary sequence of points", () => {
		fc.assert(
			fc.property(
				fc.array(finiteCoordArbitrary, { minLength: 1, maxLength: 50 }),
				(points) => {
					const [first, ...rest] = points;
					let bounds = updateBounds(first, null);
					for (const p of rest) {
						bounds = updateBounds(p, bounds);
					}

					expect(bounds[0]).toBe(Math.min(...points.map((p) => p.x)));
					expect(bounds[2]).toBe(Math.max(...points.map((p) => p.x)));
					expect(bounds[1]).toBe(Math.min(...points.map((p) => p.y)));
					expect(bounds[3]).toBe(Math.max(...points.map((p) => p.y)));
				},
			),
		);
	});

	test("adding the same points in any order produces the same final bounds", () => {
		fc.assert(
			fc.property(
				fc.array(finiteCoordArbitrary, { minLength: 1, maxLength: 30 }),
				(points) => {
					const foldInOrder = (pts: Coordinates[]): BBox => {
						const [first, ...rest] = pts;
						return rest.reduce<BBox>(
							(b, p) => updateBounds(p, b),
							updateBounds(first, null),
						);
					};

					const original = foldInOrder(points);
					const shuffled = foldInOrder([...points].reverse());
					expect(shuffled).toEqual(original);
				},
			),
		);
	});

	test("does not mutate the bounds array passed in, and returns a new instance", () => {
		fc.assert(
			fc.property(finiteCoordArbitrary, finiteCoordArbitrary, (a, b) => {
				const initial = updateBounds(a, null);
				const snapshot = [...initial];
				const next = updateBounds(b, initial);

				expect(initial).toEqual(snapshot);
				expect(next).not.toBe(initial);
			}),
		);
	});

	test("adding a point already inside the bounds leaves them unchanged", () => {
		fc.assert(
			fc.property(
				finiteCoordArbitrary,
				finiteCoordArbitrary,
				(corner1, corner2) => {
					const bounds = updateBounds(corner1, null);
					const withSecond = updateBounds(corner2, bounds);

					const midX = (withSecond[0] + withSecond[2]) / 2;
					const midY = (withSecond[1] + withSecond[3]) / 2;

					const unchanged = updateBounds(
						new Coordinates(midX, midY, "EPSG:4326", 0),
						withSecond,
					);
					expect(unchanged).toEqual(withSecond);
				},
			),
		);
	});
});
