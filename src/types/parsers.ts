import type { Options as CsvParseOptions } from 'csv-parse';

export type CsvParseFunction = (
  input: string | Buffer,
  options?: CsvParseOptions
) => any;

export type Parser = (content: string | Blob | Object) => object;

export function isParser(value: unknown): value is Parser {
  return typeof value === 'function';
}

export interface IndexedParser {
  measurements: string;
  locations?: string;
  meta?: string;
}

export type ParserMethods = Record<string, Parser>;
