import debug from 'debug';
const log = debug('readers: v2')

type ReadAs = 'json' | 'text' | 'blob' | 'response';

interface TextReaderParamsDefinition {
  text: string
}

interface UrlReaderParamsDefinition {
  resource: string;
  readAs: ReadAs;
  options: object;
}

export interface BlobReaderParamsDefinition {
  resource: Blob;
}

export interface FileSystemReaderParamsDefinition {
  path: string;
  encoding?: 'utf8' | 'utf16le' | 'latin1'; // supported Node encodings
}

export type ReaderDefinition = (
  params:
    | UrlReaderParamsDefinition
    | BlobReaderParamsDefinition
    | FileSystemReaderParamsDefinition
    | TextReaderParamsDefinition
) => Promise<Blob | string | Response>;

export interface ReaderOptionsDefinition {
  headers?: object
  gzip?: boolean
  method?: 'GET' | 'POST'
}

export interface IndexedReaderOptionsDefinition {
  measurements: ReaderOptionsDefinition
  locations: ReaderOptionsDefinition
  meta: ReaderOptionsDefinition
}

function isIndexedReaderOptions(obj: ReaderOptionsDefinition | IndexedReaderOptionsDefinition):
obj is IndexedReaderOptionsDefinition {
  return 'locations' in obj || 'measurements' in obj || 'meta' in obj;
}

export function getReaderOptions(
  options: ReaderOptionsDefinition | IndexedReaderOptionsDefinition,
  key: 'locations' | 'measurements' | 'meta'
): ReaderOptionsDefinition {
  if (isIndexedReaderOptions(options)) {
    return options[key];
  } else {
    return options;
  }
}

export interface ReaderMethodsDefinition {
  [key: string]: ReaderDefinition;
}

// Create the Map with proper typing
const contentTypeMap = new Map<string | null | undefined, ReadAs>([
  ['application/json', 'json'],
  ['application/ld+json', 'text'],
  ['text/plain', 'text'],
  ['text/csv', 'text'],
  ['text/zip', 'blob'],
  [null, 'json'],
  [undefined, 'json'],
]);

export const apiReader = async ({
  resource,
  readAs,
  options,
}: UrlReaderParamsDefinition): Promise<Blob | string | Response> => {
  log(`Fetching ${readAs} data from ${resource}`)
  const res = await fetch(resource, options);
  if (res.status !== 200) {
    throw Error(res.statusText)
  }
  if (!readAs) {
    // check headers to get return method
    const ctype = res.headers.get('Content-Type');
    // fall back to json if type is not mapped
    readAs = contentTypeMap.get(ctype) ?? 'json';
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

export const textReader = ({text}: TextReaderParamsDefinition) : Promise<string> => {
  return new Promise((resolve, _) => {
    resolve(text)
  })
}

// export const s3 = (args: ReaderParamsDefinition) => {
//   return args;
// };

// export const google = (args: ReaderParamsDefinition) => {
//   return args;
// };
