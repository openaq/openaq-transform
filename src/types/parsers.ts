import type { Options as CsvParseOptions } from 'csv-parse';

export type CsvParseFunction = (
  input: string | Buffer,
  options?: CsvParseOptions
) => any;

type ExistingData = Record<string, any>;

export interface ParserParameters {
  text: string;
  data?: ExistingData;
}

type Parser = (params: ParserParameters) => object;

export interface IndexedParser {
  measurements: string;
  locations?: string;
  meta?: string;
}

export type ParserMethods = Record<string, Parser>;
