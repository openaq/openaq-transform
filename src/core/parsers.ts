import debug from 'debug';
import type { CsvParseFunction, ParserParameters } from '../types/parsers';
const log = debug('parsers: v2');

export const createDelimitedParsers = (parse: CsvParseFunction) => {
  const csv = async ({ text }: ParserParameters) => {
    log(`Parsing ${typeof text} data using the csv method`);
    if (typeof text === 'string') {
      const data = parse(text, {
        columns: true,
        skip_empty_lines: true,
      });
      return data;
    } else {
      return text;
    }
  };

  const tsv = async ({ text }: ParserParameters) => {
    log(`Parsing ${typeof text} data using the tsv method`);
    if (typeof text === 'string') {
      return await parse(text, {
        delimiter: '\t',
        columns: true,
        skip_empty_lines: true,
      });
    } else {
      return text;
    }
  };

  return { csv, tsv };
};

export const json = async ({ text }: ParserParameters) => {
  log(`Parsing ${typeof text} data using the json method`);
  if (typeof text === 'string') {
    return JSON.parse(text);
  } else {
    return text;
  }
};
