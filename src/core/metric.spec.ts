import fc from "fast-check";
import { describe, expect, test } from "vitest";
import {
	HighValueError,
	LowValueError,
	MissingValueError,
	ProviderValueError,
	UnsupportedParameterError,
	UnsupportedUnitsError,
} from "./errors";
import { Metric, PARAMETERS } from "./metric";

const parameterUnitPairs: Array<{ parameter: string; unit: string }> = [];
for (const entry of Object.values(PARAMETERS)) {
	for (const unit of Object.keys(entry.converters)) {
		parameterUnitPairs.push({ parameter: entry.name, unit });
	}
}
const parameterUnitArbitrary = fc.constantFrom(...parameterUnitPairs);

const whitespaceCharArbitrary = fc.constantFrom(
	" ",
	"\t",
	"\n",
	"\r",
	"\f",
	"\v",
	"\u00A0",
	"\u202f",
);

const whitespaceStringArbitrary = (minLength = 1, maxLength = 10) =>
	fc
		.array(whitespaceCharArbitrary, { minLength, maxLength })
		.map((c) => c.join(""));

describe("Metric", () => {
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
		expect(new Metric("o3", "ppm").key).toBe("o3:parts");
		expect(new Metric("o3", "ug/m3").key).toBe("o3:mass");
	});

	test("supported parameter and units returned rounded", () => {
		const metric = new Metric("temperature", "c");
		expect(metric.process(18.3333333)).toBe(18.3);
	});

	test("supported paramter with differing units returned transformed", () => {
		const metric = new Metric("temperature", "f");
		expect(metric.process(65)).toBe(18.3);
	});

	test("high altitude pressure is accepted ~ 4000 m", () => {
		const metric = new Metric("pressure", "hpa");
		expect(metric.process(615)).toBe(615);
	});

	test("wind speed accepts km/h and converts to m/s", () => {
		const metric = new Metric("ws", "km/h");
		// 36 km/h = 10 m/s
		expect(metric.process(36)).toBe(10);
		// 100 km/h ≈ 27.7778 m/s, rounded to 1 decimal -> 27.8
		expect(metric.process(100)).toBe(27.8);
	});

	test("pressure accepts mmHg and converts to hPa", () => {
		const m = new Metric("pressure", "mmhg");
		// 760 mmHg ≈ 1013.247 hPa, rounded to 1 decimal -> 1013.2
		expect(m.process(760)).toBe(1013.2);
	});
});

describe("Metric.process", () => {
	test("values outside a parameter's range throws a range error", () => {
		fc.assert(
			fc.property(parameterUnitArbitrary, ({ parameter, unit }) => {
				const metric = new Metric(parameter, unit);
				const { range } = metric.parameter;
				if (!range) {
					return;
				}
				const value = 12345;
				if (metric.converter(value) !== value) {
					return;
				}

				const [low, high] = range;
				const span = high - low || 1;

				expect(() => metric.process(low - span - 1)).toThrow(LowValueError);
				expect(() => metric.process(high + span + 1)).toThrow(HighValueError);
			}),
		);
	});

	test("any blank value throws MissingValueError", () => {
		const metric = new Metric("temperature", "c");
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(null),
					fc.constant(undefined),
					fc.constant(""),
					whitespaceStringArbitrary(),
				),
				(blankValue) => {
					expect(() => metric.process(blankValue)).toThrow(MissingValueError);
				},
			),
		);
	});

	test("any non-numeric non-blank string throws ProviderValueError", () => {
		fc.assert(
			fc.property(
				parameterUnitArbitrary,
				fc
					.string({ minLength: 1, maxLength: 20 })
					.filter((s) => s.trim() !== "" && Number.isNaN(Number(s.trim()))),
				({ parameter, unit }, garbage) => {
					const metric = new Metric(parameter, unit);
					expect(() => metric.process(garbage)).toThrow(ProviderValueError);
				},
			),
		);
	});

	test("any decimal-string represenxtation of a flagged value throws ProviderValueError", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 0, max: 6 }),
				fc.boolean(),
				(trailingZeros, asString) => {
					const flags = new Map<string | number, string>([[-99, "ERROR"]]);
					const metric = new Metric("temperature", "f", flags);
					const repr =
						trailingZeros === 0 ? "-99" : `-99.${"0".repeat(trailingZeros)}`;
					const value: string | number = asString ? repr : Number(repr);

					expect(() => metric.process(value)).toThrow(ProviderValueError);
				},
			),
		);
	});
});
