import { Client } from '../core/client';
import { apiReader, textReader } from '../core/readers';
import {fileReader} from './readers';
import { csv, tsv } from './parsers';
import { json } from '../core/parsers';
import { ParserMethods } from '../types/parsers';
import type { Reader, ReaderMethods } from '../types/readers';

const readers: ReaderMethods = {
  api: apiReader as Reader,
  file: fileReader as Reader,
  text: textReader as Reader
};

const parsers: ParserMethods = {
  json,
  csv,
  tsv,
};

export class BrowserClient extends Client {
  readers = readers;
  parsers = parsers;
}
