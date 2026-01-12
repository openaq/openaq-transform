import { Client } from '../core/client';
import { apiReader } from '../core/readers';
import { fileSystemReader } from './readers';
import { csv, tsv } from './parsers';
import { json } from '../core/parsers';
import type { ReaderMethods } from '../types/readers';
import type { ParserMethods } from '../types/parsers';


const readers: ReaderMethods = {
  api: apiReader,
  file: fileSystemReader,
};

const parsers: ParserMethods = {
  json,
  csv,
  tsv,
};

export class NodeClient extends Client {
  readers = readers;
  parsers = parsers;
}
