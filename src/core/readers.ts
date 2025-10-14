import debug from 'debug';
import { isIndexedReaderOptions, UrlReaderParameters, type IndexedReaderOptions, type ReadAs, type ReaderOptions, type TextReaderParameters } from '../types/readers';
const log = debug('openaq-transform readers: DEBUG')


export function getReaderOptions<K extends keyof IndexedReaderOptions>(
  options: ReaderOptions | IndexedReaderOptions,
  key: K
): ReaderOptions {
  if (isIndexedReaderOptions(options)) {
    return options[key] ?? {};
  } else {
    return options;
  }
}

// Create the Map with proper typing
const contentTypeMap = new Map<string | null | undefined, ReadAs>([
  ['application/json', 'json'],
  ['application/ld+json', 'text'],
  ['text/plain', 'text'],
  ['text/csv', 'text'],
  ['text/zip', 'blob'],
  ['application/zip', 'blob'],
  ['application/octet-stream', 'blob'],
  [null, 'json'],
  [undefined, 'json'],
]);

export const apiReader = async ({
  resource,
  readAs,
  options,
}: UrlReaderParameters): Promise<Blob | string | Response> => {
  log(`Fetching ${readAs} data from ${resource}`)
  const res = await fetch(resource, options);
  if (res.status !== 200) {
    throw Error(res.statusText)
  }
  if (!readAs) {
    // check headers to get return method, splits at semicolon to handle charset
    // e.g. application/json; charset=utf-8
    const ctype = res.headers.get('Content-Type')?.split(';')[0];
    // fall back to json if type is not mapped
    readAs = contentTypeMap.get(ctype || '') ?? 'json';
  }
  if (readAs === 'json') {
    return res.json();
  } else if (readAs === 'text') {
    return res.text();
  } else if (readAs === 'blob') {
    return res.blob();
  } else if (readAs === 'response') {
    return res;
  } else {
    // default to json
    return res.json();
  }
};

export const textReader = async ({text}: TextReaderParameters) : Promise<string> => {
  return Promise.resolve(text);
}
