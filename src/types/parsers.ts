import type { Options as CsvParseOptions } from 'csv-parse';
import type { SourceRecord } from './data';
import type { ResourceKeys } from './resource';
import { X2jOptions } from 'fast-xml-parser';


/**
 * Base interface for all parser option objects.
 *
 * @example
 * export interface MyParserOptions extends ParserOptions {
 *   format: "my-format";
 *   customField?: string;
 * }
 */
export interface ParserOptions {
  format: string;
}

/**
 * Parser options for XML parser, passed directly to the underlying
 * `fast-xml-parser` XMLParser instance.
 *
 * All `X2jOptions` from `fast-xml-parser` are accepted via the index
 * signature, refer to that library's documentation for the full option set.
 *
 * @see {@link https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4%2C%20v5/2.XMLparseOptions.md}
 *
 * @example
 * // RSS feed example ensure <item> and <category> are always arrays
 * const options: XmlParserOptions = {
 *   format: "xml",
 *   isArray: (tagName) => ["item", "category"].includes(tagName),
 * };
 *
 * @example
 * // Atom feed example use jPath to avoid over-matching <link> in <head>
 * const options: XmlParserOptions = {
 *   format: "xml",
 *   isArray: (tagName, jPath) =>
 *     ["entry", "author", "category"].includes(tagName) ||
 *     jPath.endsWith("feed.entry.link"),
 * };
 */
export interface XmlParserOptions extends ParserOptions, X2jOptions {
    format: "xml";
}

/**
 * Parser options for delimiter-separated value content (csv, tsv, etc.).
 *
 * Extends `csv-parse`'s `Options` directly, all upstream options are
 * available and passed through to the parser unchanged. The fields declared
 * here are the commonly used subset.
 *
 * @see {@link https://csv.js.org/parse/options/}
 *
 * @example
 * // Standard comma-separated file with a header row
 * const options: DelimitedParserOptions = {
 *   format: "csv",
 *   delimiter: ",",
 *   columns: true,
 *   skip_empty_lines: true,
 * };
 *
 * @example
 * // tab separated file, casting numeric columns automatically
 * const options: DelimitedParserOptions = {
 *   format: "tsv",
 *   delimiter: "\t",
 *   columns: true,
 *   cast: true,
 * };
 */
export interface DelimitedParserOptions extends ParserOptions, CsvParseOptions {
    format: "csv" | "tsv" | "psv" | "ssv" | (string & {});
    delimiter?: string;
    columns?: boolean;
    skip_empty_lines?: boolean;
}

export type KnownParserOptions = XmlParserOptions | DelimitedParserOptions;

export type CsvParseFunction = (
  input: string | Buffer,
  options?: CsvParseOptions,
) => Promise<SourceRecord[]>;

// biome-ignore lint/suspicious/noExplicitAny: Content type must be any to allow storage of parsers with different content types in registries
export type Parser<T = unknown, TContent = any> = (
  content: TContent,
  options?: ParserOptions | KnownParserOptions,
) => Promise<T> | T;

export type StringParser<T = unknown> = Parser<T, string>;
export type JsonParser<T = unknown> = Parser<T, unknown>;
export type BlobParser<T = unknown> = Parser<T, Blob>;

export function isParser(value: unknown): value is Parser {
  return typeof value === 'function';
}

export type IndexedParser<T> = Partial<Record<ResourceKeys, keyof T | Parser>>;

export type ParserMethods = {
  // biome-ignore lint/suspicious/noExplicitAny: Parser registry must accommodate parsers with different content and return types
  [key: string]: Parser<any>;
};
