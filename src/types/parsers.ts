import type { Options as CsvParseOptions } from 'csv-parse';
import { DataContext } from './readers';

export type CsvParseFunction = (
  input: string | Buffer,
  options?: CsvParseOptions
) => any;


export interface ParserParameters {
  content: string | Blob | object;
  data?: DataContext;
}

export type Parser = (params: ParserParameters) => object;

export function isParser(value: unknown): value is Parser {
  return typeof value === 'function' && value.length ===1;
}

export interface IndexedParser {
  measurements: string;
  locations?: string;
  meta?: string;
}

export type ParserMethods = Record<string, Parser>;
