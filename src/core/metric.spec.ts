import { expect, test } from "vitest";
import {
	HighValueError,
	LowValueError,
	MissingValueError,
	ProviderValueError,
	UnsupportedParameterError,
	UnsupportedUnitsError,
} from "./errors";
import { Metric } from "./metric";

test("unsupported parameter returns error", () => {
	expect(() => new Metric("aqi", "unitless")).toThrowError(
		UnsupportedParameterError,
	);
});

test("unsupported units returns error", () => {
	expect(() => new Metric("temperature", "kelvin")).toThrowError(
		UnsupportedUnitsError,
	);
});

test("unsupported units returns error #2", () => {
	expect(() => new Metric("pm25", "kelvin")).toThrowError(
		UnsupportedUnitsError,
	);
});

test("parameter supported with both mass and parts distinquishes without explicitly providing key", () => {
	expect((new Metric("o3", "ppm")).key).toBe("o3:parts");
	expect((new Metric("o3", "ug/m3")).key).toBe("o3:mass");
});

test("supported parameter and units returned rounded", () => {
	const m = new Metric("temperature", "c");
	expect(m.process(18.3333333)).toBe(18.3);
});

test("supported paramter with differing units returned transformed", () => {
	const m = new Metric("temperature", "f");
	expect(m.process(65)).toBe(18.3);
});

test("low values throw range error", () => {
	const m = new Metric("temperature", "c");
	expect(() => m.process(-100)).toThrowError(LowValueError);
});

test("high values throw range error", () => {
	const m = new Metric("temperature", "c");
	expect(() => m.process(100)).toThrowError(HighValueError);
});

test("Non-numeric string throws provider value error", () => {
	const m = new Metric("temperature", "c");
	const v = "TOO_HIGH";
	expect(() => m.process(v)).toThrowError(ProviderValueError);
});

test("Undefined throws missing value error", () => {
	const m = new Metric("temperature", "c");
	const v = undefined;
	expect(() => m.process(v)).toThrowError(MissingValueError);
});

test("null throws missing value error", () => {
	const m = new Metric("temperature", "c");
	const v = null;
	expect(() => m.process(v)).toThrowError(MissingValueError);
});

test("empty string throws missing value error", () => {
	const m = new Metric("temperature", "c");
	const v = "";
	expect(() => m.process(v)).toThrowError(MissingValueError);
});

// essentially all numeric values as errors need to be passed in
// so -99 and 42.0 tests the same thing
test("Error flags as values throw ProviderValueError (f)", () => {
  const flags = new Map<string | number, string>([
    [-99, 'ERROR'],
  ]);
	const m = new Metric("temperature", "f", flags);
	expect(() => m.process(-99)).toThrowError(ProviderValueError);
	expect(() => m.process(-99.0)).toThrowError(ProviderValueError);
	expect(() => m.process('-99')).toThrowError(ProviderValueError);
	expect(() => m.process('-99.0')).toThrowError(ProviderValueError);
});
