import { Client } from '../core/client';
import { apiReader, textReader } from '../core/readers';
import { fileSystemReader } from './readers';
import { csv, tsv } from './parsers';
import { json } from '../core/parsers';

import type {
  ReaderDefinition,
  ReaderMethodsDefinition,
} from '../core/readers';
import { ParserMethodsDefinition } from '../core/parsers';

const readers: ReaderMethodsDefinition = {
  api: apiReader as ReaderDefinition,
  file: fileSystemReader as ReaderDefinition,
  text: textReader as ReaderDefinition
};

const parsers: ParserMethodsDefinition = {
  json,
  csv,
  tsv,
};

export class NodeClient extends Client {
  readers = readers;
  parsers = parsers;
}
