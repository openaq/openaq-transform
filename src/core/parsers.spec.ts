import { describe, expect, test, vi } from "vitest";
import { createDelimitedParsers, json, parseDelimited } from "./parsers";

describe("json parser", () => {
	test("parses valid JSON string", async () => {
		const jsonString = '{"name": "foo", "value": 42}';
		const result = await json(jsonString);
		expect(result).toEqual({ name: "foo", value: 42 });
	});

	test("parses JSON array string", async () => {
		const jsonString = '[{"id": 1}, {"id": 2}]';
		const result = await json(jsonString);
		expect(result).toEqual([{ id: 1 }, { id: 2 }]);
	});

	test("returns object as-is when content is already an object", async () => {
		const obj = { name: "foo", value: 123 };
		const result = await json(obj);
		expect(result).toBe(obj);
	});

	test("returns Blob as-is when content is a Blob", async () => {
		const blob = new Blob(["test"]);
		const result = await json(blob);
		expect(result).toBe(blob);
	});

	test("throws error on invalid JSON string", async () => {
		const invalidJson = "{invalid json}";
		await expect(json(invalidJson)).rejects.toThrow();
	});

	test("handles empty JSON object", async () => {
		const result = await json("{}");
		expect(result).toEqual({});
	});

	test("handles empty JSON array", async () => {
		const result = await json("[]");
		expect(result).toEqual([]);
	});

	test("handles null value", async () => {
		const result = await json("null");
		expect(result).toBeNull();
	});

	test("handles nested JSON structures", async () => {
		const nested = '{"outer": {"inner": {"value": 42}}}';
		const result = await json(nested);
		expect(result).toEqual({ outer: { inner: { value: 42 } } });
	});

	test("handles numbers", async () => {
		const result = await json("42");
		expect(result).toBe(42);
	});

	test("handles boolean values", async () => {
		expect(await json("true")).toBe(true);
		expect(await json("false")).toBe(false);
	});

	test("handles strings with special characters", async () => {
		const jsonString = '{"message": "Foo\\\\Bar\\t!"}';
		const result = await json(jsonString);
		expect(result).toEqual({ message: "Foo\\Bar\t!" });
	});
});

describe("parseDelimited", () => {
	test("calls parse function with string content and options", async () => {
		const mockParse = vi.fn(() => [{ name: "Del Norte" }]);
		const options = { columns: true, skip_empty_lines: true };
		const delimitedText = "name\nDel Norte";
		const result = await parseDelimited(delimitedText, mockParse, options);

		expect(mockParse).toHaveBeenCalledWith(delimitedText, options);
		expect(result).toEqual([{ name: "Del Norte" }]);
	});

	test("handles empty string", async () => {
		const mockParse = vi.fn(() => []);
		const options = { columns: true };

		const result = await parseDelimited("", mockParse, options);

		expect(mockParse).toHaveBeenCalledWith("", options);
		expect(result).toEqual([]);
	});

	test("passes through parse function errors", async () => {
		const mockParse = vi.fn(() => {
			throw new Error("Parse error");
		});
		const options = { columns: true };

		await expect(parseDelimited("invalid", mockParse, options)).rejects.toThrow(
			"Parse error",
		);
	});
});

describe("createDelimitedParsers", () => {
	describe("csv parser", () => {
		test("parses CSV string with headers", async () => {
			const mockParse = vi.fn((content, options) => [
				{ name: "Alice", age: "30" },
				{ name: "Bob", age: "25" },
			]);

			const { csv } = createDelimitedParsers(mockParse);
			const csvString = "name,age\nAlice,30\nBob,25";

			const result = await csv(csvString);

			expect(mockParse).toHaveBeenCalledWith(csvString, {
				columns: true,
				skip_empty_lines: true,
			});
			expect(result).toEqual([
				{ name: "Alice", age: "30" },
				{ name: "Bob", age: "25" },
			]);
		});

		test("handles empty CSV string", async () => {
			const mockParse = vi.fn(() => []);
			const { csv } = createDelimitedParsers(mockParse);

			const result = await csv("");

			expect(result).toEqual([]);
		});

		test("uses default CSV options", async () => {
			const mockParse = vi.fn(() => []);
			const { csv } = createDelimitedParsers(mockParse);

			await csv("name,age\nAlice,30");

			expect(mockParse).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					columns: true,
					skip_empty_lines: true,
				}),
			);
			// Should NOT have delimiter specified (uses default comma)
			expect(mockParse.mock.calls[0][1]).not.toHaveProperty("delimiter");
		});

		test("handles multiline CSV data", async () => {
			const mockParse = vi.fn(() => [
				{ name: "Alice", city: "NYC" },
				{ name: "Bob", city: "LA" },
				{ name: "Charlie", city: "Chicago" },
			]);
			const { csv } = createDelimitedParsers(mockParse);

			const csvString = "name,city\nAlice,NYC\nBob,LA\nCharlie,Chicago";
			const result = await csv(csvString);

			expect(result).toHaveLength(3);
		});
	});

	describe("tsv parser", () => {
		test("parses TSV string with headers", async () => {
			const mockParse = vi.fn((content, options) => [
				{ name: "Alice", age: "30" },
				{ name: "Bob", age: "25" },
			]);

			const { tsv } = createDelimitedParsers(mockParse);
			const tsvString = "name\tage\nAlice\t30\nBob\t25";

			const result = await tsv(tsvString);

			expect(mockParse).toHaveBeenCalledWith(tsvString, {
				delimiter: "\t",
				columns: true,
				skip_empty_lines: true,
			});
			expect(result).toEqual([
				{ name: "Alice", age: "30" },
				{ name: "Bob", age: "25" },
			]);
		});

		test("uses tab delimiter", async () => {
			const mockParse = vi.fn(() => []);
			const { tsv } = createDelimitedParsers(mockParse);

			await tsv("name\tage\nAlice\t30");

			expect(mockParse).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					delimiter: "\t",
					columns: true,
					skip_empty_lines: true,
				}),
			);
		});

		test("handles empty TSV string", async () => {
			const mockParse = vi.fn(() => []);
			const { tsv } = createDelimitedParsers(mockParse);

			const result = await tsv("");

			expect(result).toEqual([]);
		});

		test("handles TSV with multiple columns", async () => {
			const mockParse = vi.fn(() => [
				{ id: "1", name: "Alice", email: "alice@example.com" },
				{ id: "2", name: "Bob", email: "bob@example.com" },
			]);
			const { tsv } = createDelimitedParsers(mockParse);

			const tsvString =
				"id\tname\temail\n1\tAlice\talice@example.com\n2\tBob\tbob@example.com";
			const result = await tsv(tsvString);

			expect(result).toHaveLength(2);
			expect(result[0]).toHaveProperty("email");
		});
	});
});
