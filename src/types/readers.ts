export type ReadAs = 'json' | 'text' | 'blob' | 'response';

export interface TextReaderParameters {
  text: string
}

export interface UrlReaderParameters {
  resource: string;
  readAs?: ReadAs;
  options: object;
}

export interface BlobReaderParameters {
  resource: Blob;
}

export interface FileSystemReaderParameters {
  path: string;
  encoding?: 'utf8' | 'utf16le' | 'latin1'; // supported Node encodings
}

export type Reader = (
  params:
    | UrlReaderParameters
    | BlobReaderParameters
    | FileSystemReaderParameters
    | TextReaderParameters
) => Promise<Blob | string | Response>;

export interface ReaderOptions {
  headers?: Record<string, string>;
  gzip?: boolean;
  method?: 'GET' | 'POST';
  timeout?: number;
  signal?: AbortSignal;
}

export interface IndexedReaderOptions {
  measurements?: ReaderOptions
  locations?: ReaderOptions
  meta?: ReaderOptions
}

export function isIndexedReaderOptions(obj: ReaderOptions | IndexedReaderOptions):
obj is IndexedReaderOptions {
  return 'locations' in obj || 'measurements' in obj || 'meta' in obj;
}


export interface ReaderMethods {
  [key: string]: Reader;
}

export interface BaseReaderResult<T = any> {
  data: T;
  contentType?: string;
  size?: number;
}