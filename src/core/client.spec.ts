import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { translateKey } from "./client";

describe("translateKey", () => {
	test("treats the empty string as a valid field name, not a missing value", () => {
		expect(translateKey("")).toEqual({ type: "field", value: "" });
	});

	test("preserves a falsy constant value", () => {
		expect(translateKey({ type: "constant", value: 0 })).toEqual({
			type: "constant",
			value: 0,
		});
	});

	test("stringifies the result of a self-contained function", () => {
		expect(translateKey(() => "locationsId")).toEqual({
			type: "function",
			value: "locationsId",
		});
	});

	test("renders a function as the string 'undefined'", () => {
		expect(translateKey((d) => d?.device_id as string)).toEqual({
			type: "function",
			value: "undefined",
		});
	});

	test.each([
		["boolean", false],
		["number", 3600],
	])("defaults to an undefined field value for a %s", (_label, key) => {
		expect(translateKey(key as never)).toEqual({
			type: "field",
			value: undefined,
		});
	});

	test("returns string as-is as field", () => {
		fc.assert(
			fc.property(fc.string(), (s) => {
				expect(translateKey(s)).toEqual({ type: "field", value: s });
			}),
		);
	});

	test("passes constant values through unchanged", () => {
		fc.assert(
			fc.property(
				fc.record({
					type: fc.constant("constant" as const),
					value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
				}),
				(c) => {
					expect(translateKey(c)).toEqual({ type: c.type, value: c.value });
				},
			),
		);
	});
});
