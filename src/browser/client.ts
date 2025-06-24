import { Client } from '../core/client';
import { apiReader, textReader } from '../core/readers';
import {fileReader} from './readers';
import { csv, tsv } from './parsers';
import { json, ParserMethodsDefinition } from '../core/parsers';
import type {
  ReaderDefinition,
  ReaderMethodsDefinition,
} from '../core/readers';

const readers: ReaderMethodsDefinition = {
  api: apiReader as ReaderDefinition,
  file: fileReader as ReaderDefinition,
  text: textReader as ReaderDefinition
};

const parsers: ParserMethodsDefinition = {
  json,
  csv,
  tsv,
};

export class BrowserClient extends Client {
  readers = readers;
  parsers = parsers;
}
