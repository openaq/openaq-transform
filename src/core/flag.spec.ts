import { expect, test } from "vitest";
import { Flag } from "./flag";
import type { FlagData } from "../types/flag";

const flagData: FlagData = {
	sensorKey: "testing-ts1-temperature",
	starts: "2026-01-01T00:00:00Z",
	ends: "2026-01-01T01:00:00Z",
	flag: "TOO_HIGH",
	note: "Value exceeded upper range",
};

test("Flag json() returns correct structure", () => {
	const flag = new Flag(flagData);
	expect(flag.json()).toEqual({
		key: "testing-ts1-temperature-TOO_HIGH::2026-01-01T00:00:00Z",
		datetime_from: "2026-01-01T00:00:00Z",
		datetime_to: "2026-01-01T01:00:00Z",
		flag_name: "TOO_HIGH",
		note: "Value exceeded upper range",
	});
});

test("Flag uses provided key", () => {
	const flag = new Flag({ ...flagData, key: "custom-key" });
	expect(flag.key).toBe("custom-key");
});

test("Flag key uses infinity when starts is missing", () => {
	const flag = new Flag({ ...flagData, starts: "" });
	expect(flag.key).toBe("testing-ts1-temperature-TOO_HIGH::infinity");
});