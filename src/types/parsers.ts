import type { Options as CsvParseOptions } from 'csv-parse';
import { ResourceKeys } from './resource';

export type CsvParseFunction = (
  input: string | Buffer,
  options?: CsvParseOptions
) => any;

export type Parser = (content: string | Blob | Object) => object;

export function isParser(value: unknown): value is Parser {
  return typeof value === 'function';
}

export type IndexedParser<T> = Partial<Record<ResourceKeys, keyof T | Parser>>;


export type ParserMethods = Record<string, Parser>;
