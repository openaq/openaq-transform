import debug from 'debug';
import type { CsvParseFunction } from '../types/parsers';
const log = debug('openaq-transform parsers: DEBUG');

export const createDelimitedParsers = (parse: CsvParseFunction) => {
  const csv = async (content: string | Blob | Object) => {
    log(`Parsing ${typeof content} data using the csv method`);
    if (typeof content === 'string') {
      const data = parse(content, {
        columns: true,
        skip_empty_lines: true,
      });
      return data;
    } else {
      return content;
    }
  };

  const tsv = async (content: string | Blob | Object) => {
    log(`Parsing ${typeof content} data using the tsv method`);
    if (typeof content === 'string') {
      return await parse(content, {
        delimiter: '\t',
        columns: true,
        skip_empty_lines: true,
      });
    } else {
      return content;
    }
  };

  return { csv, tsv };
};

export const json = async (content: string | Blob | Object) => {
  log(`Parsing ${typeof content} data using the json method`);
  if (Array.isArray(content)) {
    // Parse each string in the array
    const parsed = content.map(item => {
      if (typeof item === 'string') {
        return JSON.parse(item);
      }
      return item;
    });
    // If single item, return it unwrapped; otherwise return array
    return parsed.length === 1 ? parsed[0] : parsed;
  }
  
  if (typeof content === 'string') {
    return JSON.parse(content);
  } else {
    return content;
  }
};
