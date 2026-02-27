import type { Options as CsvParseOptions } from "csv-parse";
import type { ResourceKeys } from "./resource";
import type { SourceRecord } from "./data";

export type CsvParseFunction = (
	input: string | Buffer,
	options?: CsvParseOptions,
) => Promise<SourceRecord[]>;


export type StringParser<T = unknown> = (content: string) => Promise<T> | T;
export type JsonParser<T = unknown> = (content: unknown) => Promise<T> | T;
export type BlobParser<T = unknown> = (content: Blob) => Promise<T> | T;

// biome-ignore lint/suspicious/noExplicitAny: Content type must be any to allow storage of parsers with different content types in registries
export type Parser<T = unknown> = (content: any) => Promise<T> | T;


export function isParser(value: unknown): value is Parser {
	return typeof value === "function";
}

export type IndexedParser<T> = Partial<Record<ResourceKeys, keyof T | Parser>>;


export type ParserMethods = {
	// biome-ignore lint/suspicious/noExplicitAny: Parser registry must accommodate parsers with different content and return types
	[key: string]: Parser<any>;
};
