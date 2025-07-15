type ReadAs = 'json' | 'text' | 'blob' | 'response';

interface TextReaderParamsDefinition {
  text: string
}

interface UrlReaderParamsDefinition {
  resource: string;
  readAs: ReadAs;
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

export interface ReaderMethodsDefinition {
  [key: string]: ReaderDefinition;
}
export const apiReader = async ({
  resource,
  readAs,
}: UrlReaderParamsDefinition): Promise<Blob | string | Response> => {
  const res = await fetch(resource);
  if (readAs === 'json') {
    return res.json();
  } else if (readAs === 'text') {
    return res.text();
  } else if (readAs === 'blob') {
    return res.blob();
  } else if (readAs === 'response') {
    return res;
  } else {
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
