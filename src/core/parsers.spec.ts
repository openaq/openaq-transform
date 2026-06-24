import { describe, expect, test, vi } from 'vitest';
import { createDelimitedParsers, json, parseDelimited, xml } from './parsers';

describe('json parser', () => {
  test('parses valid JSON string', async () => {
    const jsonString = '{"name": "foo", "value": 42}';
    const result = await json(jsonString);
    expect(result).toEqual({ name: 'foo', value: 42 });
  });

  test('parses JSON array string', async () => {
    const jsonString = '[{"id": 1}, {"id": 2}]';
    const result = await json(jsonString);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test('returns object as-is when content is already an object', async () => {
    const obj = { name: 'foo', value: 123 };
    const result = await json(obj);
    expect(result).toBe(obj);
  });

  test('returns Blob as-is when content is a Blob', async () => {
    const blob = new Blob(['test']);
    const result = await json(blob);
    expect(result).toBe(blob);
  });

  test('throws error on invalid JSON string', async () => {
    const invalidJson = '{invalid json}';
    await expect(json(invalidJson)).rejects.toThrow();
  });

  test('handles empty JSON object', async () => {
    const result = await json('{}');
    expect(result).toEqual({});
  });

  test('handles empty JSON array', async () => {
    const result = await json('[]');
    expect(result).toEqual([]);
  });

  test('handles null value', async () => {
    const result = await json('null');
    expect(result).toBeNull();
  });

  test('handles nested JSON structures', async () => {
    const nested = '{"outer": {"inner": {"value": 42}}}';
    const result = await json(nested);
    expect(result).toEqual({ outer: { inner: { value: 42 } } });
  });

  test('handles numbers', async () => {
    const result = await json('42');
    expect(result).toBe(42);
  });

  test('handles boolean values', async () => {
    expect(await json('true')).toBe(true);
    expect(await json('false')).toBe(false);
  });

  test('handles strings with special characters', async () => {
    const jsonString = '{"message": "Foo\\\\Bar\\t!"}';
    const result = await json(jsonString);
    expect(result).toEqual({ message: 'Foo\\Bar\t!' });
  });
});

describe('parseDelimited', () => {
  test('calls parse function with string content and options', async () => {
    const mockParse = vi.fn(async () => [{ name: 'Del Norte' }]);
    const options = { columns: true, skip_empty_lines: true };
    const delimitedText = 'name\nDel Norte';
    const result = await parseDelimited(delimitedText, mockParse, options);

    expect(mockParse).toHaveBeenCalledWith(delimitedText, options);
    expect(result).toEqual([{ name: 'Del Norte' }]);
  });

  test('handles empty string', async () => {
    const mockParse = vi.fn(async () => []);
    const options = { columns: true };

    const result = await parseDelimited('', mockParse, options);

    expect(mockParse).toHaveBeenCalledWith('', options);
    expect(result).toEqual([]);
  });

  test('passes through parse function errors', async () => {
    const mockParse = vi.fn(() => {
      throw new Error('Parse error');
    });
    const options = { columns: true };

    await expect(parseDelimited('invalid', mockParse, options)).rejects.toThrow(
      'Parse error',
    );
  });
});

describe('createDelimitedParsers', () => {
  describe('csv parser', () => {
    test('parses CSV string with headers', async () => {
      const mockParse = vi.fn(async () => [
        { name: 'John McCormack', age: '30' },
        { name: 'Richard Tauber', age: '25' },
      ]);

      const { csv } = createDelimitedParsers(mockParse);
      const csvString = 'name,age\nJohn McCormack,30\nRichard Tauber,25';

      const result = await csv(csvString);

      expect(mockParse).toHaveBeenCalledWith(csvString, {
        columns: true,
        skip_empty_lines: true,
      });
      expect(result).toEqual([
        { name: 'John McCormack', age: '30' },
        { name: 'Richard Tauber', age: '25' },
      ]);
    });

    test('handles empty CSV string', async () => {
      const mockParse = vi.fn(async () => []);
      const { csv } = createDelimitedParsers(mockParse);

      const result = await csv('');

      expect(result).toEqual([]);
    });

    test('uses default CSV options', async () => {
      const mockParse = vi.fn(async () => []);
      const { csv } = createDelimitedParsers(mockParse);

      await csv('name,age\nJohn McCormack,30');

      expect(mockParse).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          columns: true,
          skip_empty_lines: true,
        }),
      );
      expect(mockParse.mock.calls[0][1]).not.toHaveProperty('delimiter');
    });

    test('handles multiline CSV data', async () => {
      const mockParse = vi.fn(async () => [
        { name: 'John McCormack', city: 'Dublin' },
        { name: 'Richard Tauber', city: 'Linz' },
        { name: 'Frank Ryan', city: 'Limerick' },
      ]);
      const { csv } = createDelimitedParsers(mockParse);

      const csvString =
        'name,city\nJohn McCormack,Dublin\nRichard Tauber,Linz\nFrank Ryan,Limerick';
      const result = await csv(csvString);

      expect(result).toHaveLength(3);
    });

    test('merges custom options with defaults', async () => {
      const mockParse = vi.fn().mockResolvedValue([]);
      const { csv } = createDelimitedParsers(mockParse);

      await csv('name,age\nJohn McCormack,30', { format: 'csv', cast: true });

      expect(mockParse).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          columns: true,
          skip_empty_lines: true,
          cast: true,
        }),
      );
    });

    test('custom options can override defaults', async () => {
      const mockParse = vi.fn().mockResolvedValue([]);
      const { csv } = createDelimitedParsers(mockParse);

      await csv('name,age\nJohn McCormack,30', {
        format: 'csv',
        columns: false,
      });

      expect(mockParse).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ columns: false }),
      );
    });

    test('strips format field before passing options to parse', async () => {
      const mockParse = vi.fn().mockResolvedValue([]);
      const { csv } = createDelimitedParsers(mockParse);

      await csv('name,age\nJohn McCormack,30', { format: 'csv' });

      expect(mockParse.mock.calls[0][1]).not.toHaveProperty('format');
    });

    test('works without options', async () => {
      const mockParse = vi.fn().mockResolvedValue([]);
      const { csv } = createDelimitedParsers(mockParse);

      await expect(csv('name,age\nJohn McCormack,30')).resolves.not.toThrow();
    });
  });

  describe('tsv parser', () => {
    test('parses TSV string with headers', async () => {
      const mockParse = vi.fn(async () => [
        { name: 'John McCormack', age: '30' },
        { name: 'Richard Tauber', age: '25' },
      ]);

      const { tsv } = createDelimitedParsers(mockParse);
      const tsvString = 'name\tage\nJohn McCormack\t30\nRichard Tauber\t25';

      const result = await tsv(tsvString);

      expect(mockParse).toHaveBeenCalledWith(tsvString, {
        delimiter: '\t',
        columns: true,
        skip_empty_lines: true,
      });
      expect(result).toEqual([
        { name: 'John McCormack', age: '30' },
        { name: 'Richard Tauber', age: '25' },
      ]);
    });

    test('uses tab delimiter', async () => {
      const mockParse = vi.fn(async () => []);
      const { tsv } = createDelimitedParsers(mockParse);

      await tsv('name\tage\nJohn McCormack\t30');

      expect(mockParse).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          delimiter: '\t',
          columns: true,
          skip_empty_lines: true,
        }),
      );
    });

    test('handles empty TSV string', async () => {
      const mockParse = vi.fn(async () => []);
      const { tsv } = createDelimitedParsers(mockParse);

      const result = await tsv('');

      expect(result).toEqual([]);
    });

    test('handles TSV with multiple columns', async () => {
      const mockParse = vi.fn(async () => [
        {
          id: '1',
          name: 'John McCormack',
          email: 'john.mccormack@example.com',
        },
        {
          id: '2',
          name: 'Richard Tauber',
          email: 'richard.tauber@example.com',
        },
      ]);
      const { tsv } = createDelimitedParsers(mockParse);

      const tsvString =
        'id\tname\temail\n1\John McCormack\tjohn.mccormack@example.com\n2\tRichard Tauber\trichard.tauber@example.com';
      const result = await tsv(tsvString);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('email');
    });

	 test("custom delimiter option does not override tab", async () => {
        const mockParse = vi.fn().mockResolvedValue([]);
        const { tsv } = createDelimitedParsers(mockParse);

        await tsv("name\tage\nJohn McCormack\t30", { format: "tsv", delimiter: "," });

        expect(mockParse).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ delimiter: "\t" }),
        );
    });

    test("warns when non-tab delimiter is passed", async () => {
        const mockParse = vi.fn().mockResolvedValue([]);
        const { tsv } = createDelimitedParsers(mockParse);
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        await tsv("name\tage\nJohn McCormack\t30", { format: "tsv", delimiter: "," });

        expect(mockParse.mock.calls[0][1]).toHaveProperty("delimiter", "\t");
        warnSpy.mockRestore();
    });

    test("merges custom options while keeping tab delimiter", async () => {
        const mockParse = vi.fn().mockResolvedValue([]);
        const { tsv } = createDelimitedParsers(mockParse);

        await tsv("name\tage\nJohn McCormack\t30", { format: "tsv", cast: true });

        expect(mockParse).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                delimiter: "\t",
                columns: true,
                skip_empty_lines: true,
                cast: true,
            }),
        );
    });

    test("strips format field before passing options to parse", async () => {
        const mockParse = vi.fn().mockResolvedValue([]);
        const { tsv } = createDelimitedParsers(mockParse);

        await tsv("name\tage\nJohn McCormack\t30", { format: "tsv" });

        expect(mockParse.mock.calls[0][1]).not.toHaveProperty("format");
    });

    test("works without options", async () => {
        const mockParse = vi.fn().mockResolvedValue([]);
        const { tsv } = createDelimitedParsers(mockParse);

        await expect(tsv("name\tage\nJohn McCormack\t30")).resolves.not.toThrow();
    });
  });
});


describe("xml parser", () => {
  test("parses an XML string into an object", async () => {
    const result = await xml("<root><name>John McCormack</name></root>", undefined);
    expect(result).toEqual({ root: { name: "John McCormack" } });
  });

  test("strips format from options before passing to XMLParser", async () => {
    const result = await xml("<root/>", { format: "xml" } as any);
    expect(result).toEqual({ root: "" });
  });

  test("forwards xmlParserOptions to XMLParser", async () => {
    const result = await xml(`<root id="1"/>`, {
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    } as any);
    expect(result).toEqual({ root: { "@_id": "1" } });
  });

  test("Single items turns into array when isArray returns true", async () => {
    const result = await xml(`<root><item>John McCormack</item></root>`, {
      isArray: (name: string) => name === "item",
    } as any) as any;
    expect(result.root.item).toEqual(["John McCormack"]);
  });

  test("handles undefined options", async () => {
    const result = await xml("<root/>", undefined);
    expect(result).toEqual({ root: "" });
  });
});