import { Client } from '../core/client';
import { apiReader } from '../core/readers';
import {fileReader} from './readers';
import { csv, tsv } from './parsers';
import { json } from '../core/parsers';
import type { ParserMethods } from '../types/parsers';
import type { ReaderMethods } from '../types/readers';

const readers = {
  api: apiReader,
  file: fileReader,
} satisfies ReaderMethods;

const parsers = {
  json,
  csv,
  tsv,
} satisfies ParserMethods;

export class BrowserClient extends Client<typeof readers, typeof parsers> {
  readers = readers;
  parsers = parsers;
}
