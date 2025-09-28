export type ReadAs = 'json' | 'text' | 'blob' | 'response';

export interface TextReaderParameters {
  text: string;
}

export interface UrlReaderParameters {
  resource: string;
  readAs?: ReadAs;
  options: ReaderOptions;
}

export interface BlobReaderParameters {
  resource: Blob;
}

export interface FileSystemReaderParameters {
  path: string;
  encoding?: 'utf8' | 'utf16le' | 'latin1' | 'ascii' | 'base64' | 'hex'; // supported Node encodings
}

export type ReaderParameters =
  | UrlReaderParameters
  | BlobReaderParameters
  | FileSystemReaderParameters
  | TextReaderParameters;


export type Reader = (
  params: ReaderParameters
) => Promise<Blob | string | Response>;

export interface ReaderOptions {
  headers?: Record<string, string>;
  gzip?: boolean;
  method?: 'GET' | 'POST';
  timeout?: number;
  signal?: AbortSignal;
}

export interface IndexedReaderOptions {
  measurements?: ReaderOptions;
  locations?: ReaderOptions;
  meta?: ReaderOptions;
}

export function isIndexedReaderOptions(
  obj: ReaderOptions | IndexedReaderOptions
): obj is IndexedReaderOptions {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('locations' in obj || 'measurements' in obj || 'meta' in obj)
  );
}

export interface ReaderMethods {
  [key: string]: Reader;
}

export interface BaseReaderResult<T = any> {
  data: T;
  contentType?: string;
  size?: number;
}
