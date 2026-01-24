import { expect, test } from "vitest";
import { Resource } from "./resource.ts";

test("resource with static parameters works", () => {
	const resource = new Resource({
		url: "https://example.com/locations/:locationsId",
		parameters: [{ locationsId: 42 }, { locationsId: 43 }, { locationsId: 44 }],
	});
	const urls = resource.urls;
	expect(urls).toStrictEqual([
		{ url: "https://example.com/locations/42" },
		{ url: "https://example.com/locations/43" },
		{ url: "https://example.com/locations/44" },
	]);
});

test("resource with single static url works", () => {
	const resource = new Resource({ url: "https://example.com/locations/2178" });
	const urls = resource.urls;
	expect(urls).toStrictEqual([{ url: "https://example.com/locations/2178" }]);
});

test("resource with parameters function that returns static values works", () => {
	const resource = new Resource({
		url: "https://example.com/locations/:locationsId",
		parameters: () => [
			{ locationsId: 42 },
			{ locationsId: 43 },
			{ locationsId: 44 },
		],
	});
	const urls = resource.urls;
	expect(urls).toStrictEqual([
		{ url: "https://example.com/locations/42" },
		{ url: "https://example.com/locations/43" },
		{ url: "https://example.com/locations/44" },
	]);
});

test("resource with dynamic function and data works", () => {
	const data = [
		{
			locations: [
				{ locationsId: 42 },
				{ locationsId: 43 },
				{ locationsId: 44 },
			],
		},
	];
	const parametersFunction = (d) => d[0].locations.map((o) => o);
	const resource = new Resource({
		url: "https://example.com/locations/:locationsId",
		parameters: parametersFunction,
	});
	resource.data = data;
	const urls = resource.urls;
	expect(urls).toStrictEqual([
		{ url: "https://example.com/locations/42" },
		{ url: "https://example.com/locations/43" },
		{ url: "https://example.com/locations/44" },
	]);
});

test("resource with jmespath and data works", () => {
	const data = [
		{
			locations: [
				{ locationsId: 42 },
				{ locationsId: 43 },
				{ locationsId: 44 },
			],
		},
	];
	const resource = new Resource({
		url: "https://example.com/locations/:locationsId",
		parameters: { type: "jmespath", expression: "[0].locations" },
	});
	resource.data = data;
	const urls = resource.urls;
	expect(urls).toStrictEqual([
		{ url: "https://example.com/locations/42" },
		{ url: "https://example.com/locations/43" },
		{ url: "https://example.com/locations/44" },
	]);
});

test("resource defaults to undefined output when not specified", () => {
	const resource = new Resource({ url: "https://example.com/data" });
	expect(resource.output).toBeUndefined();
});

test("resource can explicitly set output to array", () => {
	const resource = new Resource({
		url: "https://example.com/data",
		output: "array",
	});
	expect(resource.output).toBe("array");
});

test("resource can set output to object", () => {
	const resource = new Resource({
		url: "https://example.com/data",
		output: "object",
	});
	expect(resource.output).toBe("object");
});

test("resource with parameters and object output", () => {
	const resource = new Resource({
		url: "https://example.com/data?page=:page",
		parameters: [{ page: 1 }, { page: 2 }],
		output: "object",
	});
	expect(resource.output).toBe("object");
	expect(resource.urls).toStrictEqual([
		{ url: "https://example.com/data?page=1" },
		{ url: "https://example.com/data?page=2" },
	]);
});

test("resource readAs defaults to undefined for auto-detection", () => {
	const resource = new Resource({ url: "https://example.com/data" });
	expect(resource.readAs).toBeUndefined();
});

test("resource can explicitly set readAs to json", () => {
	const resource = new Resource({
		url: "https://example.com/data",
		readAs: "json",
	});
	expect(resource.readAs).toBe("json");
});

test("resource can set readAs to text", () => {
	const resource = new Resource({
		url: "https://example.com/data.csv",
		readAs: "text",
	});
	expect(resource.readAs).toBe("text");
});

test("resource can set readAs to blob", () => {
	const resource = new Resource({
		url: "https://example.com/data.zip",
		readAs: "blob",
	});
	expect(resource.readAs).toBe("blob");
});

test("resource with both readAs and output", () => {
	const resource = new Resource({
		url: "https://example.com/data?page=:page",
		parameters: [{ page: 1 }, { page: 2 }],
		readAs: "json",
		output: "array",
	});
	expect(resource.readAs).toBe("json");
	expect(resource.output).toBe("array");
});

test("resource strict defaults to false for production mode", () => {
	const resource = new Resource({ url: "https://example.com/data" });
	expect(resource.strict).toBe(false);
});

test("resource can explicitly set strict to true for dev mode", () => {
	const resource = new Resource({
		url: "https://example.com/data",
		strict: true,
	});
	expect(resource.strict).toBe(true);
});

test("resource can explicitly set strict to false", () => {
	const resource = new Resource({
		url: "https://example.com/data",
		strict: false,
	});
	expect(resource.strict).toBe(false);
});
