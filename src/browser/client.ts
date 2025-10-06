import { Client } from '../core/client';
import { apiReader, textReader } from '../core/readers';
import {fileReader} from './readers';
import { csv, tsv } from './parsers';
import { json } from '../core/parsers';
import { ParserMethods } from '../types/parsers';
import type { Reader, ReaderMethods } from '../types/readers';

const readers = {
  api: apiReader as Reader,
  file: fileReader as Reader,
  text: textReader as Reader
} satisfies ReaderMethods;;

const parsers = {
  json,
  csv,
  tsv,
} satisfies ParserMethods;

export class BrowserClient extends Client<typeof readers, typeof parsers> {
  readers = readers;
  parsers = parsers;
}
